#!/usr/bin/env python3
"""Pubblica una release Mac+Win su R2 + aggiorna system_settings Supabase.

Requires env vars (read from website/.env.local typically):
  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
  SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY

Usage:
  set -a; . website/.env.local; set +a
  python3 scripts/publish-release.py 2.4.3
"""
import os, sys, json, hashlib, base64, urllib.request, urllib.error
from datetime import datetime, timezone

try:
    import boto3
    from botocore.config import Config
except ImportError:
    sys.exit("Install boto3: pip3 install --break-system-packages boto3")

VERSION = sys.argv[1] if len(sys.argv) > 1 else None
if not VERSION:
    sys.exit("Usage: publish-release.py <version>")

def need(k, *aliases):
    for n in (k, *aliases):
        v = os.environ.get(n)
        if v: return v
    sys.exit(f"Missing env: {k}")

R2_ACCOUNT_ID        = need("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID     = need("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = need("R2_SECRET_ACCESS_KEY")
R2_BUCKET            = need("R2_BUCKET_NAME")
R2_ENDPOINT          = os.environ.get("R2_ENDPOINT") or f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
SUPABASE_URL         = need("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = need("SUPABASE_SERVICE_ROLE_KEY")

RELEASE_PREFIX = "app-releases/stable"

MAC_DIR = os.environ.get("MAC_RELEASE_DIR", "desktop-app/greeting-friend-api-main/release")
WIN_DIR = os.environ.get("WIN_RELEASE_DIR", "/tmp/winrel-" + VERSION)

# Convenzione nomi electron-builder per Mac:
#   arm64.dmg   = "RescueManager-X-arm64.dmg"
#   x64.dmg     = "RescueManager-X.dmg"
#   arm64.zip   = "RescueManager-X-arm64-mac.zip"
#   x64.zip     = "RescueManager-X-mac.zip"
FILES = [
    (f"{MAC_DIR}/RescueManager-{VERSION}-arm64.dmg",               "mac", "arm64", "dmg",      False),
    (f"{MAC_DIR}/RescueManager-{VERSION}-arm64.dmg.blockmap",      "mac", "arm64", "blockmap", True),
    (f"{MAC_DIR}/RescueManager-{VERSION}-arm64-mac.zip",           "mac", "arm64", "zip",      False),
    (f"{MAC_DIR}/RescueManager-{VERSION}-arm64-mac.zip.blockmap",  "mac", "arm64", "blockmap", True),
    (f"{MAC_DIR}/RescueManager-{VERSION}.dmg",                     "mac", "x64",   "dmg",      False),
    (f"{MAC_DIR}/RescueManager-{VERSION}.dmg.blockmap",            "mac", "x64",   "blockmap", True),
    (f"{MAC_DIR}/RescueManager-{VERSION}-mac.zip",                 "mac", "x64",   "zip",      False),
    (f"{MAC_DIR}/RescueManager-{VERSION}-mac.zip.blockmap",        "mac", "x64",   "blockmap", True),
    (f"{WIN_DIR}/RescueManager Setup {VERSION}.exe",               "win", "x64",   "exe",      False),
    (f"{WIN_DIR}/RescueManager Setup {VERSION}.exe.blockmap",      "win", "x64",   "blockmap", True),
]

def sha512_b64(path):
    h = hashlib.sha512()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024*1024), b""):
            h.update(chunk)
    return base64.b64encode(h.digest()).decode()

def content_type_for(path):
    p = path.lower()
    if p.endswith(".dmg"): return "application/x-apple-diskimage"
    if p.endswith(".zip"): return "application/zip"
    if p.endswith(".exe"): return "application/x-msdownload"
    if p.endswith(".blockmap"): return "application/octet-stream"
    if p.endswith(".yml"): return "text/yaml"
    return "application/octet-stream"

def supabase_upsert(payload):
    url = f"{SUPABASE_URL}/rest/v1/system_settings?on_conflict=key"
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r: return r.status, b""
    except urllib.error.HTTPError as e: return e.code, e.read()

def main():
    s3 = boto3.client(
        "s3", endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4", region_name="auto"),
    )

    # Verifica esistenza file
    missing = [p for p, *_ in FILES if not os.path.exists(p)]
    if missing:
        print("FILE MANCANTI:")
        for p in missing: print(f"  - {p}")
        return 1

    print(f"=== UPLOAD R2 ({len(FILES)} file) ===")
    metas = []
    for path, plat, arch, asset, is_blockmap in FILES:
        filename = os.path.basename(path)
        size = os.path.getsize(path)
        key = f"{RELEASE_PREFIX}/{filename}"
        sha = sha512_b64(path) if not is_blockmap else None
        print(f"  → {filename} ({size/1024/1024:.1f} MB)")
        with open(path, "rb") as f:
            s3.upload_fileobj(f, R2_BUCKET, key, ExtraArgs={"ContentType": content_type_for(path)})
        metas.append({
            "platform": plat, "arch": arch, "asset": asset,
            "filename": filename, "size": size, "sha512": sha,
            "is_blockmap": is_blockmap,
        })

    print()
    print("=== YML MANIFEST ===")
    release_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    yml_specs = {"mac": ("latest-mac.yml", "zip"), "win": ("latest.yml", "exe"), "linux": ("latest-linux.yml", "appimage")}
    for plat, (yml_name, primary) in yml_specs.items():
        prims = [m for m in metas if m["platform"] == plat and m["asset"] == primary]
        if not prims: continue
        prims.sort(key=lambda m: 0 if m["arch"] == "arm64" else 1)
        files_yaml = "".join(f"  - url: {m['filename']}\n    sha512: {m['sha512']}\n    size: {m['size']}\n" for m in prims)
        first = prims[0]
        yml = (
            f"version: {VERSION}\nfiles:\n{files_yaml}"
            f"path: {first['filename']}\nsha512: {first['sha512']}\nreleaseDate: '{release_date}'\n"
        )
        s3.put_object(Bucket=R2_BUCKET, Key=f"{RELEASE_PREFIX}/{yml_name}", Body=yml.encode(), ContentType="text/yaml")
        print(f"  ✓ {yml_name} ({len(prims)} files)")

    print()
    print("=== SUPABASE system_settings ===")
    ok = fail = 0
    for m in metas:
        key_name = f"app_release_{m['platform']}_{m['arch']}_{m['asset']}"
        value = {
            "version": VERSION, "filename": m["filename"], "size": m["size"],
            "releaseDate": release_date, "assetType": m["asset"],
            "arch": m["arch"], "platform": m["platform"],
        }
        if m["sha512"]: value["sha512"] = m["sha512"]
        code, body = supabase_upsert({
            "key": key_name, "value": value,
            "description": f"Release desktop {m['platform']}/{m['arch']}/{m['asset']}",
            "updated_at": release_date,
        })
        if code in (200, 201, 204):
            print(f"  ✓ {key_name}")
            ok += 1
        else:
            print(f"  ✗ {key_name} [HTTP {code}]: {body.decode()[:150]}")
            fail += 1

    print()
    print(f"=== DONE — {ok} ok, {fail} fail ===")
    return 0 if fail == 0 else 2

if __name__ == "__main__":
    sys.exit(main())
