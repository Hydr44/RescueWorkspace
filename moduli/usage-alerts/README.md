# Usage Alerts (VPS)

Servizio cron che avvisa i clienti via email quando il consumo di una metrica
del piano raggiunge **80%** e **100%** del limite. Nessun blocco: è un avviso
"superamento morbido". Gemello di `regulatory-monitor` (stessa infrastruttura).

## Metriche
Archivio (storage), Compilazioni automatiche, SMS/messaggi, budget Consulente IA.
Limiti effettivi da `get_org_effective_limits(org)` (override org sopra il piano);
consumo da `get_org_usage(org)`. Anti-doppione: tabella `usage_alerts`
(1 email per org × metrica × soglia × mese).

## Deploy sul VPS
```
cd /opt/usage-alerts
npm install --production
npm run dry          # anteprima: cosa invierebbe, senza inviare
pm2 start ecosystem.config.js && pm2 save
```

## Test manuale
- `npm run dry`   — stampa i superamenti senza inviare né registrare nulla
- `npm run check` — esegue davvero (invia + registra)

## Configurazione
Legge `SUPABASE_*` e `SMTP_*` da `/root/.env`. Override in `.env` locale
(`USAGE_ALERTS_SCHEDULE`, `USAGE_ALERTS_TZ`, `USAGE_ALERTS_RUN_ON_START`).
Schedule default: `0 7 * * *` (Europe/Rome). Istanza singola (fork) obbligatoria.
