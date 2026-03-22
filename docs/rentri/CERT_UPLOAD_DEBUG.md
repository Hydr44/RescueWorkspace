# 🐛 Debug Upload Certificato RENTRI

## Problema

Upload del certificato `.p12` fallisce con errore:
```
Chiave privata non trovata nel .p12. 
Il file potrebbe essere corrotto o in un formato non supportato.
```

## Info File
- Nome: `SCZMNL05L21D960T (1).p12`
- Dimensione: 2145 bytes
- Password: `6o^Z+waO`
- CF: `SCZMNL05L21D960T`

## Possibili Cause

### 1. Deploy Vercel Non Completato
Il fix che ho fatto potrebbe non essere ancora deployato.

**Verifica**: Vai su https://vercel.com/hydr44s-projects/web e controlla che l'ultimo deploy sia "Ready"

### 2. Formato PKCS12 Particolare
Il certificato RENTRI potrebbe usare un formato che `node-forge` non riesce a leggere.

### 3. Password Errata
Anche se abbiamo la password corretta, potrebbe esserci un problema di encoding.

## Soluzioni Alternative

### Opzione A: Estrazione Manuale con OpenSSL

Possiamo estrarre certificato e chiave manualmente e inserirli direttamente nel DB:

```bash
# Su Mac/Linux
cd ~/Downloads

# Estrai certificato
openssl pkcs12 -in "SCZMNL05L21D960T (1).p12" -clcerts -nokeys -out cert.pem -passin pass:'6o^Z+waO'

# Estrai chiave privata
openssl pkcs12 -in "SCZMNL05L21D960T (1).p12" -nocerts -nodes -out key.pem -passin pass:'6o^Z+waO'

# Mostra contenuto (per verificare)
cat cert.pem
cat key.pem
```

### Opzione B: Usare Libreria Alternativa

Invece di `node-forge`, potremmo usare `@peculiar/x509` o eseguire `openssl` direttamente dal backend.

### Opzione C: Verificare Logs Vercel

Controllare i log del backend per vedere esattamente cosa sta succedendo:

1. Vai su https://vercel.com/hydr44s-projects/web
2. Click sul deployment più recente
3. Tab "Functions"
4. Cerca logs di `/api/rentri/certificati/upload`
5. Cerca `[CERT-UPLOAD]` per vedere i dettagli

## Prossimi Step

1. ✅ Verificare deploy Vercel completato
2. ⏳ Controllare logs backend su Vercel
3. ⏳ Provare estrazione manuale con OpenSSL
4. ⏳ Se necessario, cambiare approccio nel backend

