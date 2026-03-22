# SDI-SFTP - Architettura Server VPS

## Proposta: Server Node.js sulla VPS

Invece di gestire SFTP da Vercel (che non può accedere ai certificati sulla VPS), creiamo un server Node.js dedicato sulla VPS che:

1. ✅ Ha accesso diretto ai certificati (`/opt/sdi-certs/`)
2. ✅ Gestisce connessioni SFTP direttamente
3. ✅ Espone API REST che Vercel/frontend possono chiamare
4. ✅ Gestisce firma, cifratura, upload SFTP localmente

## Architettura

```
Frontend (Electron) 
    ↓
Vercel API (/api/sdi-sftp/send)
    ↓
VPS Server Node.js (217.154.118.37:3002)
    ↓
SFTP Server SDI (217.154.118.37:22)
    ↓
SDI Sogei
```

## Vantaggi

- ✅ **Sicurezza**: Certificati rimangono sulla VPS, mai esposti a Vercel
- ✅ **Performance**: Nessun overhead di trasferimento file attraverso Vercel
- ✅ **Semplicità**: Accesso diretto a filesystem e certificati
- ✅ **Coerenza**: Stessa architettura del server RENTRI polling

## Struttura Server

```
/opt/sdi-sftp-server/
├── package.json
├── server.js          # Server Express
├── lib/
│   ├── sftp-client.js    # Client SFTP
│   ├── crypto.js         # Firma e cifratura
│   └── xml-generator.js  # Generazione XML FatturaPA
└── .env
```

## API Endpoints

- `POST /api/sdi-sftp/send` - Invia fatture via SFTP
- `GET /api/sdi-sftp/status/:filename` - Stato file
- `GET /api/sdi-sftp/files` - Lista file in directory
- `GET /health` - Health check

## Variabili d'Ambiente

```env
PORT=3002
SFTP_HOST=127.0.0.1  # Localhost (stesso server)
SFTP_PORT=22
SFTP_USERNAME=sdi
SFTP_PRIVATE_KEY=/root/.ssh/sdi_key  # Chiave SSH per utente sdi
TEST_MODE=true

CERT_FIRMA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.firma.p12
CERT_CIFRA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12
CERT_SOGEI_PUBLIC_PATH=/opt/sdi-certs/sogeiunicocifra.pem
CERT_PASSWORD=IBVvOZqq

SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Nginx Config

Aggiungere a `/etc/nginx/sites-available/rentri`:

```nginx
# SDI-SFTP Server
server {
    listen 443 ssl;
    server_name sdi-sftp.rescuemanager.eu;

    location /api/sdi-sftp/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Vercel API Route

La route su Vercel diventa un proxy semplice:

```typescript
// website/src/app/api/sdi-sftp/send/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Inoltra al server VPS
  const response = await fetch('https://sdi-sftp.rescuemanager.eu/api/sdi-sftp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  return NextResponse.json(await response.json());
}
```

## Prossimi Passi

1. Creare struttura server sulla VPS
2. Implementare server Express
3. Configurare Nginx
4. Testare connessione
5. Aggiornare route Vercel per proxy

