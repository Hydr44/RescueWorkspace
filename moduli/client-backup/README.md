# Client Backup (VPS)

Backup giornaliero **per-cliente**: ogni notte esporta i dati di ogni org non-demo
e li salva su R2 in `backups/<org_id>/<YYYY-MM-DD>/` (JSON per tabella + `manifest.json`
+ `backup.zip`), con retention configurabile. Gemello di regulatory-monitor/usage-alerts.

- Tabelle esportate = `rpc list_backup_tables()` (tutte quelle con `org_id`, esclusi log/transitorie/deprecate).
- Foto/allegati: già su storage → nel backup ci sono i **record**, non i binari.
- NON sostituisce il backup Postgres di Supabase: è un export leggibile/consegnabile per cliente.

## Deploy
```
cd /opt/client-backup && npm install --production
npm run dry        # elenca org+tabelle, non scrive su R2
npm run run-once   # esegue subito
pm2 start ecosystem.config.js && pm2 save
```
Schedule default `0 3 * * *` (Europe/Rome). Istanza singola (fork) obbligatoria.
