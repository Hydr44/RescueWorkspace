# Rapporto Analisi VPS — RescueManager SDI Server

**Data:** 11 Febbraio 2026  
**Host:** `charming-keller.217-154-118-37.plesk.page` (217.154.118.37)  
**OS:** Ubuntu 24.04, kernel 6.8.0-90-generic  
**Node:** v20.19.6  
**Uptime:** 49 giorni  
**Accesso:** SSH via `vps-sdi`

---

## 1. Risorse Hardware

| Risorsa | Valore | Stato |
|---------|--------|-------|
| **CPU** | Load avg 0.00 | ✅ Idle |
| **RAM** | 3.8 GB totale, 1.3 GB usata, 2.5 GB disponibile | ✅ OK |
| **Disco** | 116 GB totale, 9.9 GB usato (9%) | ✅ OK |
| **Swap** | 0 B (nessuno) | ⚠️ Nessun swap configurato |

---

## 2. Servizi Attivi (7 microservizi Node.js)

| # | Servizio | Porta | PID | RAM | Uptime | Stato | Restart |
|---|----------|-------|-----|-----|--------|-------|---------|
| 1 | **sdi-sftp-server** | 3004 (localhost) | 1564288 | 49 MB | 23 giorni | ✅ online | 61 |
| 2 | **rentri-api** (cluster x2) | 3003 (PM2) | 1501672/78 | 68+66 MB | 24 giorni | ✅ online | 6+6 |
| 3 | **rentri-polling** | 3001 | 1501633 | 39 MB | 24 giorni | ✅ online | 148 |
| 4 | **oauth-proxy-server** | 3005 (localhost) | 1858914 | 56 MB | 19 giorni | ✅ online | 66 |
| 5 | **rvfu-proxy-direct** | 3002 | 1761548 | 48 MB | 20 giorni | ✅ online | 0 |
| 6 | **rvfu-proxy-tunnel** | — | — | — | — | ❌ stopped | 11 |
| 7 | **rentri-cert-upload** | 3456 | 2633684 | 27 MB | 7 giorni | ✅ online | 0 |

**Totale RAM Node.js:** ~353 MB  
**Process Manager:** PM2 v6.0.14

### Mappa porte

```
:22    → SSH + SFTP SDI (utente "sdi", chroot /var/sftp/sdi)
:80    → Nginx (redirect HTTPS)
:443   → Nginx (reverse proxy)
:3001  → rentri-polling
:3002  → rvfu-proxy-direct
:3003  → rentri-api (cluster)
:3004  → sdi-sftp-server (solo localhost, via Nginx)
:3005  → oauth-proxy-server (solo localhost)
:3306  → MariaDB (Plesk, localhost)
:3456  → rentri-cert-upload
```

---

## 3. Struttura Directory

```
/opt/
├── sdi-sftp-server/        19 MB   ← Server fatturazione SDI
│   ├── server.js                    (1110 righe, Express)
│   ├── xml-generator.js             (634 righe, FatturaPA 1.2.2)
│   ├── debug/                       (8 file ZIP debug)
│   └── node_modules/
├── sdi-certs/              28 KB   ← Certificati SDI
│   ├── EMMAT002.*.firma.p12         (firma digitale)
│   ├── EMMAT002.*.cifra.p12         (cifratura)
│   ├── sogeiunicocifra.pem          (chiave pubblica Sogei)
│   └── CAEntrate.pem                (CA Agenzia Entrate)
├── rentri-api/             18 MB   ← API RENTRI completa
│   ├── server.js
│   ├── routes/                      (14 route files)
│   │   ├── anagrafiche.js
│   │   ├── blocchi.js
│   │   ├── certificati.js
│   │   ├── codifiche.js
│   │   ├── formulari.js
│   │   ├── limiti.js
│   │   ├── maintenance.js
│   │   ├── monitoring.js
│   │   ├── movimenti.js
│   │   ├── mud.js
│   │   ├── registri.js
│   │   ├── status.js
│   │   └── ai-validate.js
│   └── lib/
├── rentri-polling/         17 MB   ← Polling RENTRI periodico
│   └── server.js                    (16836 righe)
├── oauth-proxy-server/     12 MB   ← Proxy OAuth2 RVFU/RENTRI
│   ├── server.js
│   ├── auth-handlers.js
│   ├── exchange-handler.js
│   ├── operator-handler.js
│   ├── operator-create-handler.js
│   └── operator-login-handler.js
├── rentri-cert-upload/     5.8 MB  ← Upload certificati RENTRI
│   └── cert-upload-server.js
└── cisco/                  23 MB   ← AnyConnect VPN (per RVFU)

/var/sftp/sdi/                      ← SFTP chroot per SDI
├── DatiVersoSdI/                    (invio fatture PRODUZIONE)
├── DatiVersoSdITest/                (invio fatture TEST)
│   └── semaforodaSogei.log          (semaforo attivo)
├── DatiDaSdI/                       (ricezione PRODUZIONE)
│   └── 26 file .csv.run             (EO + FO dal 14 gen al 2 feb)
├── DatiDaSdITest/                   (ricezione TEST)
│   ├── 11 file EO.*.xml.run         (esiti)
│   ├── 2 file ER.*.run              (errori)
│   └── 5 file FO.*.zip.p7m.enc     (fatture passive cifrate)
├── notifiche/                       (vuota)
├── upload/
└── download/

/root/vps_rescue/rvfu-proxy/        ← Proxy RVFU con VPN
│   ├── server.js                    (18161 righe)
│   ├── login-handler.js
│   ├── session-manager.js
│   └── [vari .md di documentazione]

/etc/nginx/ssl/rentri/              ← Certificati mTLS RENTRI
│   ├── SCZMNL05L21D960T-cert.pem
│   ├── SCZMNL05L21D960T-key.pem
│   ├── SCZMNL05L21D960T-chain.pem
│   └── ca-bundle.pem
```

---

## 4. Configurazione Nginx (Reverse Proxy)

| Dominio | Backend | SSL | Note |
|---------|---------|-----|------|
| `sdi-sftp.rescuemanager.eu` | localhost:3004 | ❌ **Solo HTTP!** | Manca HTTPS |
| `rentri-test.rescuemanager.eu` | demoapi.rentri.gov.it | ✅ Let's Encrypt + mTLS | Proxy con certificati client |
| `rentri.rescuemanager.eu` | api.rentri.gov.it | ✅ Let's Encrypt + mTLS | Produzione |
| `oauth.rescuemanager.eu` | localhost:3005 | ✅ Let's Encrypt | OAuth2 proxy |
| `rvfu.rescuemanager.eu` | localhost:3002 | ✅ Let's Encrypt | RVFU proxy |

---

## 5. Canale SFTP SDI

**Configurazione SSH:**
- Utente: `sdi`
- Chroot: `/var/sftp/sdi`
- ForceCommand: `internal-sftp`
- Autenticazione: chiave pubblica (`authorized_keys`)

**File ricevuti da SDI (produzione):**
- **26 file** in `DatiDaSdI/` (dal 14 gennaio al 2 febbraio 2026)
- **EO** (Esiti Operatore): notifiche di consegna/rifiuto
- **FO** (Fatture Operatore): fatture passive ricevute (cifrate)

**File ricevuti da SDI (test):**
- **11 EO** (esiti)
- **2 ER** (errori di trasmissione)
- **5 FO** (fatture passive cifrate .zip.p7m.enc)

**Semaforo Sogei:** Attivo (`semaforodaSogei.log` aggiornato oggi 11 feb)

---

## 6. Problemi Identificati

### 6.1 Critici

| # | Problema | Dettaglio |
|---|----------|-----------|
| **P1** | **sdi-sftp.rescuemanager.eu senza HTTPS** | Il Nginx serve solo HTTP (porta 80). Le chiamate dall'app desktop transitano in chiaro. Chiunque sulla rete può intercettare dati fatture. |
| **P2** | **61 restart di sdi-sftp-server** | Il server si è riavviato 61 volte in 23 giorni (~2.6/giorno). Indica crash frequenti. |
| **P3** | **148 restart di rentri-polling** | 148 restart in 24 giorni (~6/giorno). Il log mostra `ReferenceError: Cannot access 'https' before initialization` — bug nel codice. |
| **P4** | **Errori decifratura FO** | I log mostrano `ADM-ZIP: Invalid or unsupported zip format` e `Invalid CEN header` quando si tenta di decifrare fatture passive. La decifratura P7M→ZIP non funziona correttamente. |
| **P5** | **Org senza vat/tax_code** | Log ripetuto: `Org 1ea3be12... non ha vat/tax_code configurati`. Il filtro fatture passive non funziona. |
| **P6** | **Nessun swap** | Con 3.8 GB RAM e 7 processi Node, un picco potrebbe causare OOM killer. |
| **P7** | **Tutto gira come root** | Tutti i processi Node girano come `root`. Rischio sicurezza elevato. |

### 6.2 Importanti

| # | Problema | Dettaglio |
|---|----------|-----------|
| **P8** | **Cartella notifiche vuota** | `/var/sftp/sdi/notifiche/` è vuota — le notifiche SDI (RC, NS, MC, NE) non vengono processate/archiviate |
| **P9** | **rvfu-proxy-tunnel stopped** | Il tunnel mode per RVFU è fermo (11 restart, poi stopped). Solo il direct mode funziona |
| **P10** | **Nessun backup automatico** | Non c'è cron per backup dei file SDI o dei certificati |
| **P11** | **Certificati RENTRI prod = demo** | Il commento nel Nginx dice `TODO: sostituire con certificati prod quando disponibili` — la produzione RENTRI usa certificati demo |
| **P12** | **File .bak sparsi** | `server.js.backup`, `server.js.bak`, `server.js.bak2` in più directory — nessun version control |
| **P13** | **MariaDB attivo ma non usato** | Porta 3306 in ascolto (Plesk default), probabilmente non necessario |
| **P14** | **Cron sync FIR ogni 5 min** | `rentri-sync-fir.sh` gira ogni 5 minuti ma non è chiaro se funziona (output soppresso) |

### 6.3 Minori

| # | Problema |
|---|----------|
| **P15** | VPN AnyConnect installata (23 MB) ma tunnel mode stopped — potrebbe essere rimossa se non necessaria |
| **P16** | Debug ZIP in `/opt/sdi-sftp-server/debug/` — 8 file, nessuna pulizia automatica |
| **P17** | Password VPN in chiaro in `/root/vps_rescue/rvfu-proxy/vpn-password.txt` |

---

## 7. Riepilogo Architettura VPS

```
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │   Nginx :443   │ ← SSL termination
              │   (reverse     │
              │    proxy)      │
              └───┬───┬───┬───┘
                  │   │   │
    ┌─────────────┤   │   ├─────────────┐
    ▼             ▼   │   ▼             ▼
 :3004         :3003  │  :3005       :3002
 SDI-SFTP     RENTRI  │  OAuth      RVFU
 Server       API x2  │  Proxy      Proxy
    │             │   │              │
    │             │   │              │
    ▼             │   │              ▼
 /var/sftp/sdi    │   │         rvfu.aci.it
 (SFTP chroot)    │   │         (via VPN)
    │             │   │
    ▼             ▼   ▼
 SDI Sogei    RENTRI API    Supabase
 (SFTP)       (mTLS)        (PostgreSQL)
              
 Servizi aggiuntivi:
 :3001 → rentri-polling (sync periodico)
 :3456 → rentri-cert-upload
```

---

## 8. Raccomandazioni Prioritarie

### Immediato (questa settimana)
1. **Abilitare HTTPS su sdi-sftp.rescuemanager.eu** — Aggiungere certificato Let's Encrypt e redirect HTTP→HTTPS
2. **Configurare swap** — `fallocate -l 2G /swapfile && mkswap /swapfile && swapon /swapfile`
3. **Configurare vat/tax_code** nell'organizzazione Supabase per fermare i warning nei log
4. **Fixare il bug rentri-polling** — `ReferenceError: Cannot access 'https' before initialization` alla riga 9

### Breve termine (1-2 settimane)
5. **Investigare crash sdi-sftp-server** — 61 restart, probabilmente legati agli errori ADM-ZIP
6. **Fixare decifratura FO** — Il flusso P7M→ZIP non funziona (errore `Invalid CEN header`)
7. **Aggiungere backup automatico** — Cron giornaliero per `/var/sftp/sdi/` e `/opt/sdi-certs/`
8. **Creare utente non-root** per i servizi Node.js

### Medio termine (1 mese)
9. **Implementare gestione notifiche SDI** — Processare file EO/ER e aggiornare stato fatture in Supabase
10. **Sostituire certificati RENTRI prod** con certificati di produzione reali
11. **Mettere tutto sotto Git** — Eliminare i file `.bak` e usare un repo per il codice VPS
12. **Disabilitare MariaDB** se non usato — libera ~50 MB RAM

---

*Fine rapporto*
