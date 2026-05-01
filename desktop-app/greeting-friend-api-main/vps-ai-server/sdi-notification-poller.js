#!/usr/bin/env node
/**
 * SDI Notification Poller
 *
 * Legge i file FO depositati da SdI in /var/sftp/sdi/DatiDaSdI[Test]/,
 * li decifra, estrae le notifiche (NS/RC/MC/AT/DT/SE/EC/NE) e aggiorna lo
 * stato delle fatture in Supabase.
 *
 * Riferimenti manuale "Istruzioni per il Servizio SDIFTP v4.3":
 *  - cap. 3.1.4 nomenclatura supporti FO
 *  - cap. 3.2 file esito o scarto
 *  - cap. 5.1.1 flusso file da SdI (rinominati .zip.p7m.enc al termine trasmissione)
 *
 * Usage:
 *   node sdi-notification-poller.js [--once] [--dir=...] [--processed-dir=...]
 *
 * Env (file /opt/ai-server/.env oppure /root/.env):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SDI_CERT_CIFRA_PATH (default /opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12)
 *   SDI_CERT_PASSWORD
 *   SDI_DATA_DIRS (csv, default "/var/sftp/sdi/DatiDaSdI,/var/sftp/sdi/DatiDaSdITest")
 *   SDI_PROCESSED_DIR (default /var/sftp/sdi/processed)
 *   SDI_POLL_INTERVAL_MS (default 600000 = 10min)
 */

require("dotenv").config({ path: "/opt/ai-server/.env" });
require("dotenv").config({ path: "/root/.env" });

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");
const AdmZip = require("adm-zip");
const { createClient } = require("@supabase/supabase-js");

// ── Config ──
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CERT_CIFRA_PATH = process.env.SDI_CERT_CIFRA_PATH || "/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12";
const CERT_PASSWORD = process.env.SDI_CERT_PASSWORD || "IBVvOZqq";
const DATA_DIRS = (process.env.SDI_DATA_DIRS || "/var/sftp/sdi/DatiDaSdI,/var/sftp/sdi/DatiDaSdITest").split(",");
const PROCESSED_DIR = process.env.SDI_PROCESSED_DIR || "/var/sftp/sdi/processed";
const POLL_INTERVAL_MS = Number(process.env.SDI_POLL_INTERVAL_MS || 600_000);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[fo-poller] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

fs.mkdirSync(PROCESSED_DIR, { recursive: true });

// ── Status mapping (NS/RC/MC/AT/DT/SE/EC/NE) → invoice sdi_status ──
const STATUS_MAP = {
  NS: "rejected",          // RicevutaScarto / NotificaScarto (B2B/PA)
  RC: "delivered",         // RicevutaConsegna
  MC: "not_delivered",     // NotificaMancataConsegna / impossibilità di recapito
  AT: "transmitted",       // Attestazione avvenuta trasmissione (PA)
  DT: "term_expired",      // NotificaDecorrenzaTermini (PA)
  NE: "esito_committente", // NotificaEsitoCedente (PA)
  SE: "scarto_esito",      // ScartoEsito Committente (PA)
  EC: "esito_processed",   // EsitoCommittente (PA)
};

// ── Crypto helpers ──
function decryptP7mEnc(inputPath) {
  // 1. Decifra il file .zip.p7m.enc usando la chiave privata di cifratura
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fo-poller-"));
  const certPem = path.join(tmpDir, "cert.pem");
  const keyPem = path.join(tmpDir, "key.pem");
  const decryptedP7m = path.join(tmpDir, "decrypted.zip.p7m");
  const innerZip = path.join(tmpDir, "inner.zip");

  try {
    // Estrai cert + chiave dal p12 (RC2-40 richiede -legacy su OpenSSL 3+)
    execSync(`openssl pkcs12 -legacy -in "${CERT_CIFRA_PATH}" -nokeys -out "${certPem}" -passin pass:${CERT_PASSWORD}`, { stdio: "pipe" });
    execSync(`openssl pkcs12 -legacy -in "${CERT_CIFRA_PATH}" -nocerts -nodes -out "${keyPem}" -passin pass:${CERT_PASSWORD}`, { stdio: "pipe" });

    // 2. Decrypt SMIME
    execSync(`openssl smime -decrypt -binary -inform DER -in "${inputPath}" -out "${decryptedP7m}" -inkey "${keyPem}" -recip "${certPem}"`, { stdio: "pipe" });

    // 3. Verifica firma + estrai contenuto (ZIP interno)
    execSync(`openssl smime -verify -noverify -binary -inform DER -in "${decryptedP7m}" -out "${innerZip}"`, { stdio: "pipe" });

    const buf = fs.readFileSync(innerZip);
    return { buf, tmpDir };
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw new Error(`Decrypt failed: ${err.message}`);
  }
}

// ── Notification parsing ──
function detectNotificationType(filename, xml) {
  // Filename pattern: IT<piva>_<progressivo>_<TIPO>_<seq>.xml
  const m = filename.match(/_([A-Z]{2})_\d+\.xml$/i);
  if (m) return m[1].toUpperCase();
  // Fallback: tag root
  if (xml.includes("RicevutaScarto") || xml.includes("NotificaScarto")) return "NS";
  if (xml.includes("RicevutaConsegna")) return "RC";
  if (xml.includes("NotificaMancataConsegna") || xml.includes("RicevutaImpossibilita")) return "MC";
  if (xml.includes("NotificaDecorrenzaTermini")) return "DT";
  if (xml.includes("AttestazioneTrasmissione")) return "AT";
  if (xml.includes("NotificaEsito")) return "NE";
  if (xml.includes("ScartoEsito")) return "SE";
  return null;
}

function parseNotification(xml, type) {
  const fields = {};
  const grab = (tag) => {
    const re = new RegExp(`<(?:[a-zA-Z0-9]+:)?${tag}[^>]*>([\\s\\S]*?)</(?:[a-zA-Z0-9]+:)?${tag}>`);
    const m = xml.match(re);
    return m ? m[1].trim() : null;
  };
  fields.identificativoSdI = grab("IdentificativoSdI");
  fields.nomeFile = grab("NomeFile");
  fields.dataOraRicezione = grab("DataOraRicezione");
  fields.messageId = grab("MessageId");
  fields.hash = grab("Hash");

  // Errori (solo NS / SE)
  if (type === "NS" || type === "SE") {
    const errors = [];
    const errorRegex = /<(?:[a-zA-Z0-9]+:)?Errore[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9]+:)?Errore>/g;
    let m;
    while ((m = errorRegex.exec(xml)) !== null) {
      const e = m[1];
      const codice = (e.match(/<(?:[a-zA-Z0-9]+:)?Codice[^>]*>([\s\S]*?)</) || [])[1]?.trim();
      const descr = (e.match(/<(?:[a-zA-Z0-9]+:)?Descrizione[^>]*>([\s\S]*?)</) || [])[1]?.trim();
      const sugg = (e.match(/<(?:[a-zA-Z0-9]+:)?Suggerimento[^>]*>([\s\S]*?)</) || [])[1]?.trim();
      if (codice || descr) errors.push({ codice, descrizione: descr, suggerimento: sugg });
    }
    fields.errori = errors;
  }

  return fields;
}

// ── Match notification → invoice ──
async function findInvoiceForNotification(notif) {
  // 1. Cerca per IdentificativoSdI in meta
  if (notif.identificativoSdI) {
    const { data } = await supabase
      .from("invoices")
      .select("id, number, meta, sdi_status")
      .eq("meta->>sdi_identificativo", notif.identificativoSdI)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  // 2. Cerca per nome file: IT<piva>_<progressivo>.xml.p7m → estrai progressivo
  // e matcha con invoices.number (o.* fields)
  if (notif.nomeFile) {
    const m = notif.nomeFile.match(/_(\d+)\.xml/);
    if (m) {
      const progressivo = m[1];
      // Strategia: cerchiamo l'ultima fattura inviata recentemente con quel
      // progressivo nel meta o un MessageId. Fallback: by MessageId.
      const { data } = await supabase
        .from("invoices")
        .select("id, number, meta, sdi_status")
        .eq("meta->>sdi_progressivo_invio_sdi", progressivo)
        .limit(1)
        .maybeSingle();
      if (data) return data;
    }
  }

  // 3. Fallback: cerca per MessageId
  if (notif.messageId) {
    const { data } = await supabase
      .from("invoices")
      .select("id, number, meta, sdi_status")
      .eq("meta->>sdi_message_id", notif.messageId)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  return null;
}

// ── Apply notification to invoice ──
async function applyNotification(invoice, type, notif, sourceFile) {
  const newStatus = STATUS_MAP[type];
  if (!newStatus) {
    console.log(`[fo-poller] tipo ${type} non mappato, skip`);
    return false;
  }

  const meta = { ...(invoice.meta || {}) };
  meta[`sdi_${type.toLowerCase()}_received_at`] = notif.dataOraRicezione || new Date().toISOString();
  meta.sdi_identificativo = notif.identificativoSdI || meta.sdi_identificativo;
  meta.sdi_message_id = notif.messageId || meta.sdi_message_id;
  meta.sdi_processed_at = new Date().toISOString();
  meta.sdi_processed_from_file = sourceFile;
  meta.sdi_last_notification_type = type;

  if (type === "NS" || type === "SE") {
    meta.sdi_rejection_code = notif.errori?.[0]?.codice || null;
    meta.sdi_rejection_description = notif.errori?.[0]?.descrizione || null;
    meta.sdi_rejection_suggestion = notif.errori?.[0]?.suggerimento || null;
    meta.sdi_rejection_errors = notif.errori || [];
  }

  const { error } = await supabase
    .from("invoices")
    .update({ sdi_status: newStatus, meta })
    .eq("id", invoice.id);

  if (error) {
    console.error(`[fo-poller] update fail invoice ${invoice.id}: ${error.message}`);
    return false;
  }
  console.log(`[fo-poller] ✓ invoice ${invoice.number} (${invoice.id.slice(0,8)}) → ${newStatus}`);
  return true;
}

// ── Process one FO file ──
async function processFOFile(filepath) {
  const filename = path.basename(filepath);
  console.log(`[fo-poller] Processing ${filename}`);

  let tmpDir;
  try {
    const { buf, tmpDir: t } = decryptP7mEnc(filepath);
    tmpDir = t;

    const zip = new AdmZip(buf);
    const entries = zip.getEntries();
    const notifications = [];

    for (const entry of entries) {
      if (!entry.entryName.endsWith(".xml")) continue;
      // Skip file di quadratura (FO.<piva>.<seq>.xml)
      if (entry.entryName.startsWith("FO.")) continue;

      const xml = entry.getData().toString("utf8");
      const type = detectNotificationType(entry.entryName, xml);
      if (!type) {
        console.log(`[fo-poller]   ${entry.entryName}: tipo non riconosciuto, skip`);
        continue;
      }
      const notif = parseNotification(xml, type);
      notifications.push({ type, notif, entryName: entry.entryName });
    }

    let appliedCount = 0;
    for (const { type, notif, entryName } of notifications) {
      const invoice = await findInvoiceForNotification(notif);
      if (!invoice) {
        console.log(`[fo-poller]   ${entryName}: invoice non trovata (idSdI=${notif.identificativoSdI}, msgId=${notif.messageId})`);
        continue;
      }
      const ok = await applyNotification(invoice, type, notif, filename);
      if (ok) appliedCount++;
    }

    // Sposta file in processed
    const dest = path.join(PROCESSED_DIR, filename);
    fs.copyFileSync(filepath, dest);
    fs.unlinkSync(filepath);
    console.log(`[fo-poller]   moved ${filename} → ${PROCESSED_DIR} (${appliedCount}/${notifications.length} applicate)`);
    return { processed: true, applied: appliedCount, total: notifications.length };
  } catch (err) {
    console.error(`[fo-poller]   ERROR ${filename}: ${err.message}`);
    return { processed: false, error: err.message };
  } finally {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── Scan dirs and process ──
async function scanAndProcess() {
  let totalProcessed = 0;
  let totalApplied = 0;

  for (const dir of DATA_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir)
      .filter(f => /^FO\.\d+\.\d+\.\d+\.\d+\.zip\.p7m\.enc$/.test(f));

    if (files.length > 0) {
      console.log(`[fo-poller] ${dir}: ${files.length} file FO da processare`);
    }

    for (const f of files) {
      const r = await processFOFile(path.join(dir, f));
      if (r.processed) {
        totalProcessed++;
        totalApplied += r.applied || 0;
      }
    }
  }
  return { totalProcessed, totalApplied };
}

// ── Main ──
async function main() {
  const args = process.argv.slice(2);
  const once = args.includes("--once");

  console.log(`[fo-poller] Started. Dirs: ${DATA_DIRS.join(", ")}, processed: ${PROCESSED_DIR}, interval: ${POLL_INTERVAL_MS}ms${once ? " (one-shot)" : ""}`);

  const run = async () => {
    try {
      const r = await scanAndProcess();
      if (r.totalProcessed > 0) {
        console.log(`[fo-poller] Run complete: ${r.totalProcessed} files processed, ${r.totalApplied} notifications applied`);
      }
    } catch (err) {
      console.error("[fo-poller] Run failed:", err);
    }
  };

  await run();
  if (once) {
    process.exit(0);
  }
  setInterval(run, POLL_INTERVAL_MS);
}

main();
