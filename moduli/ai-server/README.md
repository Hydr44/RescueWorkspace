# RescueAI v2 — AI Server

Backend Express + Anthropic Claude (Sonnet 4.6 + Haiku 4.5) per assistente intelligente con tool calling, streaming SSE e prompt caching.

## Caratteristiche

- **Modelli**: Sonnet 4.6 per reasoning, Haiku 4.5 per query rapide. Selezione automatica in base alla complessità.
- **Tool use**: 10 tool read-only filtrati per `org_id` (clienti, fatture, trasporti, demolizioni, piazzale, autisti, veicoli, settings, KPI, ricerca globale).
- **Streaming SSE**: token-by-token + eventi `tool_call` / `tool_result` per UI reattiva.
- **Prompt caching**: system prompt + tool definitions cached → ~10× riduzione costi su conversazioni lunghe.
- **Rate limit**: 100 req/ora per org (configurabile).
- **Sicurezza**: tutti i tool filtrano per `org_id` server-side; le credenziali (password, api_key) sono filtrate dai risultati di `query_settings`.

## Endpoint

### `POST /api/ai/chat` (SSE)
```json
{
  "org_id": "uuid",
  "route": "/fatture",
  "question": "Quanto ho fatturato questo mese?",
  "context": { "company": {...}, "page": {...} },
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }]
}
```

**Eventi SSE**:
- `meta`: `{ model, rateLimitRemaining }`
- `text`: `{ delta }` — token streaming
- `tool_call`: `{ id, name, input }` — AI sta consultando un servizio
- `tool_result`: `{ id, name, ok, summary }` — risultato tool
- `done`: `{ stop_reason, usage, iterations }` — fine
- `error`: `{ message }` — errore

### `GET /health`
`{ ok: true, service, uptime, version }`

## Deploy su VPS

**ATTENZIONE: il deploy NON tocca endpoint esistenti.**
- Porta 3200 (assist-server è 3100)
- Nuovo processo PM2 separato
- Nuovo location nginx `/api/ai/*`

### 1. Caricare codice su VPS
```bash
# Da locale
scp -r vps-ai-server vps-sdi:/opt/
```

### 2. Sul VPS — install
```bash
ssh vps-sdi
cd /opt/vps-ai-server
npm install --production
cp .env.example .env
nano .env   # imposta SUPABASE_SERVICE_ROLE_KEY e ANTHROPIC_API_KEY
```

### 3. Avvio con PM2 (NON tocca processi esistenti)
```bash
pm2 start server.js --name ai-server --time
pm2 save
pm2 logs ai-server --lines 50
```

### 4. Nginx — aggiungere SOLO un location nuovo
**Modifica solo il vhost esistente aggiungendo un blocco location, senza toccare altri**:

```nginx
# Aggiungere dentro il server block esistente di rentri-test.rescuemanager.eu (o nuovo subdomain ai.rescuemanager.eu)
location /api/ai/ {
    proxy_pass http://127.0.0.1:3200;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;

    # SSE: disabilita buffer
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding on;

    # Timeout lunghi per streaming
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
}
```

```bash
sudo nginx -t           # verifica sintassi
sudo systemctl reload nginx
```

### 5. Test
```bash
curl https://rentri-test.rescuemanager.eu/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"org_id":"<uuid>","question":"ciao"}' \
  --no-buffer
```

## Costi stimati

**Modello primario**: Sonnet 4.6 ($3/$15 per Mtok, cache read $0.30)

Esempio conversazione (5 turni, 2 tool calls/turno):
- System + tool defs: ~2000 tok → cached → $0.0006 dopo prima call
- Tool results: ~3000 tok/turno
- Output: ~500 tok/turno
- **Costo per conversazione**: ~$0.02-0.05
- **Per cliente attivo (50-150 q/giorno)**: ~€3-8/mese con caching

Con Haiku per query semplici: -70% sulle query brevi.

## Sicurezza

✅ Tool filtrano sempre per `org_id` → un'org non può leggere dati di un'altra
✅ Service role key usata solo server-side, mai esposta al client
✅ Sanitizer su `query_settings` rimuove password/api_key/private_key
✅ Rate limit per org
✅ Cap dimensione tool result (8000 char) → evita esfiltrazione massiva
✅ Read-only: nessun tool scrive sul DB
✅ Max iterazioni tool (8) → evita loop infiniti

⚠️ TODO prima di produzione:
- [ ] Verificare JWT utente lato server (oggi accetta qualsiasi `org_id` se chi chiama lo conosce — OK per dev/staging, da blindare con auth Supabase per prod)
- [ ] Aggiungere logging strutturato (Sentry/Pino)
- [ ] Spostare rate limit su Redis se multi-istanza

## Sviluppo locale
```bash
npm install
cp .env.example .env  # compila
npm run dev
# → http://127.0.0.1:3200/health
```
