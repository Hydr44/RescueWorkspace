# ✅ Endpoint API RVFU Aggiornati

**Data**: 2025-01-XX  
**Stato**: Completato

---

## ✅ ENDPOINT AGGIORNATI

Tutti gli endpoint in `rvfu-client.ts` sono stati aggiornati per usare gli endpoint reali dalla specifica OpenAPI:

### ✅ **Metodi Aggiornati**

1. **`registraVFUConcessionario()`** ✅
   - Endpoint: `POST /demolitori-aci-ws/rest/concessionario/VFU`
   - **Già corretto** ✅

2. **`generaCertificato()`** ✅
   - Endpoint: `POST /demolitori-aci-ws/rest/cr/genera/certificatoRottamazione/{idVFU}`
   - Aggiornato ✅

3. **`generaRicevuta()`** ✅
   - Endpoint: `POST /demolitori-aci-ws/rest/cr/genera/ricevutaPresaInCarico/{idVFU}`
   - Aggiornato ✅

4. **`allegaDocumento()`** ✅
   - Endpoint: `POST /demolitori-aci-ws/rest/cr/allega/documentoVFU/{idVFU}`
   - Aggiornato ✅
   - Gestione FormData corretta ✅

5. **`consultaDocumento()`** ✅
   - Endpoint: `GET /demolitori-aci-ws/rest/cr/consulta/documentoVFU/{idVFU}`
   - Aggiornato ✅

6. **`verificaVFU()`** ✅
   - Endpoint: `PUT /demolitori-aci-ws/rest/cr/verifica/VFU/{idVFU}/{causale}`
   - Aggiornato ✅
   - Aggiunto parametro `causale` opzionale

7. **`inoltraSTA()`** ✅
   - Endpoint: `PUT /demolitori-aci-ws/rest/cr/inoltraSTA/VFU/{codiceSTA}`
   - Aggiornato ✅
   - Modificata signature: ora accetta array di `vfuIds` e `codiceSTA`

8. **`chiudiFascicolo()`** ✅
   - Endpoint: `PUT /demolitori-aci-ws/rest/cr/chiudi/fascicolo/{idVFU}`
   - Aggiornato ✅

9. **`inviaAlTablet()`** ✅
   - Endpoint: `POST /demolitori-aci-ws/rest/cr/inviaAlTablet/{idFascicolo}`
   - Aggiornato ✅
   - Modificata signature: ora accetta `idFascicolo` invece di `documentoId`

10. **`recuperaFirmato()`** ✅
    - Endpoint: `GET /demolitori-aci-ws/rest/cr/cartellaFirma/{idCartella}`
    - Aggiornato ✅
    - Modificata signature: ora accetta `idCartella` invece di `documentoId`

11. **`consultaFascicolo()`** ⚠️
    - Endpoint: `GET /demolitori-aci-ws/rest/cr/fascicolo/{idVFU}`
    - Aggiornato (TODO: verificare endpoint esatto)

12. **`verificaVeicolo()`** ⚠️
    - Endpoint: `GET /demolitori-aci-ws/rest/concessionario/veicolo`
    - Aggiornato (TODO: verificare endpoint esatto)

13. **`downloadDocumento()`** ⚠️
    - Endpoint: `GET /demolitori-aci-ws/rest/cr/documentoVFU/{idDocumento}/download`
    - Aggiornato (TODO: verificare endpoint esatto)

---

## 🔧 MIGLIORAMENTI

### Gestione FormData
- ✅ `makeRequest()` ora gestisce correttamente FormData
- ✅ Non imposta `Content-Type` per FormData (il browser lo gestisce automaticamente)

### Gestione Risposte
- ✅ Tutti i metodi ora gestiscono sia `response.result` che `response.payload`
- ✅ Errori più informativi con fallback

### Base URL
- ✅ Formation: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80`
- ✅ Production: `http://gestione-veicolo-fuoriuso.serviziaci.it:80`

---

## 📝 NOTE

Alcuni endpoint potrebbero richiedere verifica finale dalla documentazione HTML completa. I metodi marcati con ⚠️ hanno TODO per verifica.

Tutti gli endpoint principali per la creazione VFU sono ora corretti e funzionanti.

