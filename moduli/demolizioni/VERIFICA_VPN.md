# Verifica Connessione VPN

## Errore Attuale

```
POST https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate net::ERR_NAME_NOT_RESOLVED
```

Questo errore indica che l'app Electron **non riesce a risolvere il nome host** `ssoformazione.ilportaledeltrasporto.it`.

## Possibili Cause

1. **VPN non attiva**: La VPN deve essere connessa per accedere agli endpoint ACI/MIT
2. **VPN disconnessa**: La VPN potrebbe essersi disconnessa
3. **DNS non configurato**: Anche con VPN attiva, il DNS potrebbe non risolvere correttamente
4. **App Electron non usa VPN**: L'app Electron potrebbe non usare la connessione di rete con VPN

## Soluzioni

### 1. Verifica VPN Attiva

Controlla che la VPN sia attiva:
- Verifica l'icona VPN nella barra del menu
- Prova a fare ping dall terminale:

```bash
ping -c 3 ssoformazione.ilportaledeltrasporto.it
```

Se il ping fallisce, la VPN non è attiva o non funziona correttamente.

### 2. Verifica Risoluzione DNS

Prova a risolvere il nome host:

```bash
nslookup ssoformazione.ilportaledeltrasporto.it
```

O:

```bash
dig ssoformazione.ilportaledeltrasporto.it
```

Se non risolve, il DNS non funziona correttamente anche con VPN attiva.

### 3. Riavvia VPN

Se la VPN è attiva ma non funziona:
1. Disconnetti la VPN
2. Riconnetti la VPN
3. Attendi che la connessione si stabilizzi
4. Riprova l'app Electron

### 4. Verifica Configurazione VPN

Assicurati che:
- La VPN sia configurata correttamente
- Le route di rete siano configurate correttamente
- Il DNS della VPN sia attivo

## Note

- L'app Electron usa la stessa connessione di rete del sistema operativo
- Se la VPN è attiva nel sistema, l'app Electron dovrebbe essere in grado di accedervi
- Se il problema persiste, potrebbe essere necessario verificare le impostazioni di rete del sistema

