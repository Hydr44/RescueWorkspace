/**
 * Descrizioni "cosa fa" di ogni servizio (mostrate nell'admin).
 * Le chiavi sono i nomi pm2; i servizi staging-* ereditano dalla base
 * (lo strip del prefisso "staging-" è fatto in lib/pm2.js).
 */
module.exports = {
  'assist-server': 'API richieste di soccorso/assistenza — posizione cliente in tempo reale (assist.rescuemanager.eu). Gestisce la tabella assistance_requests e i link storage.',
  'lead-api': 'API lead “pesanti”: attivazione demo (crea utente + org), generazione preventivi e PDF. Cuore dell’onboarding/CRM. Cluster a 2 istanze.',
  'gps-server': 'Ricezione posizioni dai tracker GPS dei mezzi (Teltonika :5027, GT06/Concox :5028). Aggiorna gps_devices e il tracking dei trasporti.',
  'ai-server': 'RescueAI v2 — assistente Claude (tool use, streaming SSE, prompt caching) usato dal desktop. Endpoint /api/ai/chat.',
  'sdi-ws-prod': 'Web service SDI (SDICoop) — trasmissione e ricezione delle fatture elettroniche verso l’Agenzia delle Entrate.',
  'sdi-ws-test': 'Web service SDI in ambiente di test/collaudo.',
  'sdi-processor': 'Applica le notifiche SDI (RC/NS/MC/DT/AT) allo stato delle fatture e importa le fatture passive ricevute. Sostituisce il vecchio lavoro del desktop.',
  'rentri-api': 'API RENTRI — registri, movimenti (carico/scarico), vidima per il modulo rifiuti. Cluster a 2 istanze.',
  'rentri-server': 'Proxy per le trasmissioni RENTRI con mTLS (autenticazione a certificati verso il gestore).',
  'oauth-proxy-server': 'Proxy OAuth — scambio e refresh dei token RVFU/ACI, con Redis. Espone /health. Custodisce i secret lato server.',
  'ebay-oauth': 'Server OAuth eBay per l’integrazione multi-org (marketplace/ricambi).',
  'messaging-server': 'Notifiche trasporti al cliente + OTP per la firma, via WhatsApp Cloud API (Meta). Account centrale RescueManager.',
  'regulatory-monitor': 'Cron: sorveglia le fonti ufficiali RENTRI/SDI/RVFU e invia una email quando escono nuove note o specifiche normative.',
  'usage-alerts': 'Cron (07:00): confronta il consumo di ogni cliente con i limiti del piano e invia l’avviso email a 80% e 100%. Nessun blocco.',
  'monitoring-service': 'Sorveglia le connessioni al DB Supabase: /db risponde 503 oltre il 75% (45/60) per allertare in caso di saturazione.',
  'vps-control': 'Questa API: espone stato servizi, log, restart/stop/start e backup all’admin panel. Protetta da token, con audit.',
};
