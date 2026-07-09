# SDI Processor (server-side)

Applica le NOTIFICHE SdI (RC/NS/MC/DT/AT) allo stato delle fatture e importa le
FATTURE PASSIVE ricevute, leggendo `storage/<env>/{notifiche,in}` di sdi-ws-server.
Sostituisce il lavoro che prima faceva solo il desktop (processSDINotifications +
importIncomingFromFO). Idempotente via marker per-file `.applied`/`.imported`.

Deploy VPS: `/opt/sdi-ws-server/tools/sdi-processor.js`, pm2 `sdi-processor` (60s).
env: test→Supabase staging, prod→Supabase prod (config `/etc/sdi-ws/supabase-*.json`).
