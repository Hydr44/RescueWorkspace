#!/usr/bin/env bash
# Deploy in PRODUZIONE della feature "preventivi: pacchetti + riepilogo + IVA" (2026-09-18).
#
# Ordine obbligatorio: 1) SQL  2) lead-api  3) website  4) admin panel.
# Lo script fa i passi 2 e 3 (idempotenti, con backup). Il passo 1 va fatto prima
# a mano (vedi sotto), il passo 4 è una build locale.
#
#   Uso:  bash scripts/deploy-preventivi-prod.sh
#
# ── 1) SQL su Supabase PROD (progetto ienzdgrqalltvkdkuamp) ─────────────────
#   Incolla nel SQL editor il file:
#     website/supabase/migrations/20260918_lead_quotes_packages.sql
#   È additivo e idempotente (add column if not exists): non tocca i preventivi esistenti.
#   Verifica: select column_name from information_schema.columns
#             where table_name='lead_quotes' and column_name in ('packages','one_time_total','prices_include_vat');
#
set -euo pipefail
cd "$(dirname "$0")/.."

VPS=root@217.154.118.37
STAMP=$(date +%Y%m%d-%H%M%S)

# ── 2) lead-api PROD (/opt/lead-api, pm2 "lead-api") ────────────────────────
echo "== [2/3] lead-api → $VPS:/opt/lead-api"
ssh "$VPS" "cd /opt/lead-api && tar czf /opt/lead-api-backup-$STAMP.tgz lib routes assets server.js package.json && echo backup: /opt/lead-api-backup-$STAMP.tgz"
# niente --delete: lascia intatti node_modules e i .bak storici sul server
rsync -az --exclude='*.bak*' moduli/lead-api/lib moduli/lead-api/routes moduli/lead-api/assets "$VPS:/opt/lead-api/"
rsync -az moduli/lead-api/server.js moduli/lead-api/package.json "$VPS:/opt/lead-api/"
ssh "$VPS" "cd /opt/lead-api && npm install --omit=dev --no-audit --no-fund >/dev/null 2>&1; pm2 restart lead-api >/dev/null && sleep 3 && curl -s -m 5 http://127.0.0.1:3006/health && echo && pm2 logs lead-api --lines 20 --nostream 2>/dev/null | grep -i 'error' | tail -5 || true"
echo "   rollback: ssh $VPS 'cd /opt/lead-api && tar xzf /opt/lead-api-backup-$STAMP.tgz && pm2 restart lead-api'"

# ── 3) website: merge fast-forward in main → deploy Vercel ───────────────────
echo "== [3/3] website: feat/preventivo-pacchetti → main"
(
  cd website
  git fetch -q origin
  git checkout -q main
  git pull -q --ff-only origin main
  git merge --ff-only feat/preventivo-pacchetti
  git push -q origin main
  echo "   pushed $(git rev-parse --short HEAD) — verifica tra qualche minuto: curl -s https://rescuemanager.eu/api/health"
)

cat <<'EOF'

== [4/4] admin panel (build locale, manuale)
   cd admin-panel
   git stash push -u -m "wip mud/rentri"     # esclude dalla build il lavoro MUD/RENTRI non committato
   npm run build:mac                         # (o build:win) — usa .env.signing per la firma
   git stash pop
EOF
