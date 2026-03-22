# 🔍 Analisi Personalizzazione Certificato di Rottamazione

**Data Analisi**: 2025-01-XX  
**Versione Manuale**: SpecificheWS-GestioneDemolitori1.24

---

## 📋 RICERCA NEI MANUALI

### **Risultati Ricerca**

1. **Template CDR Rivisitato (Versione 1.21)**
   - Nel change log viene menzionata "Rivisitazione template CDR"
   - **Nessuna informazione specifica sulla personalizzazione** per le aziende

2. **Generazione Certificato**
   - Il certificato viene **"generato dal sistema"** (ACI/MIT)
   - Non sono presenti parametri di personalizzazione nell'endpoint API
   - Endpoint: `POST /rest/cr/genera/certificatoRottamazione/{idVFU}`
   - **Nessun body request** - solo `idVFU` nel path

3. **Postilla CDR**
   - Esiste un endpoint per aggiungere postille: `POST /rest/cr/genera/postillaCdr/{idVFU}`
   - Permette di aggiungere informazioni aggiuntive al certificato
   - **Non è personalizzazione del template**, ma aggiunta di contenuti

---

## ✅ CONCLUSIONI

### **Certificato NON Personalizzabile**

Secondo i manuali e le specifiche API:

1. ❌ **Il certificato viene generato automaticamente dal sistema ACI/MIT**
2. ❌ **Non ci sono parametri API per personalizzare template, logo, o branding**
3. ❌ **Il template è standardizzato e gestito da ACI/MIT**

### **Cosa È Possibile**

1. ✅ **Postilla CDR** - Aggiungere informazioni testuali aggiuntive tramite postilla
   - Endpoint: `POST /rest/cr/genera/postillaCdr/{idVFU}`
   - Schema: `PostillaCdrCreate` (da verificare struttura esatta)

2. ✅ **Certificato Cartaceo** - Caricare un certificato cartaceo personalizzato
   - Secondo il manuale: "Ai demolitori è consentito di emettere un certificato di rottamazione cartaceo, per sopperire a situazioni particolari"
   - Deve essere caricato nel sistema entro 24 ore
   - Deve essere firmato digitalmente

### **Raccomandazione**

Per personalizzare il certificato per le aziende:

1. **Opzione 1 - Postilla CDR**: Usare la postilla per aggiungere informazioni aziendali (logo, contatti, ecc.)
   - ✅ Supportato dall'API
   - ⚠️ Limitato a testo/immagini in una postilla

2. **Opzione 2 - Certificato Cartaceo Personalizzato**: 
   - Generare un PDF personalizzato lato client
   - Caricarlo come documento nel sistema RVFU
   - Firmarlo digitalmente
   - ⚠️ Richiede implementazione custom per generazione PDF

3. **Opzione 3 - Documento Aggiuntivo**:
   - Generare un documento aziendale separato (non certificato ufficiale)
   - Allearlo al VFU come documento aggiuntivo
   - ✅ Più flessibile ma non è il certificato ufficiale

---

## 💡 PROPOSTA IMPLEMENTAZIONE

### **Postilla CDR (Raccomandato)**

1. Implementare endpoint `POST /rest/cr/genera/postillaCdr/{idVFU}`
2. Permettere inserimento di testo/HTML per postilla personalizzata
3. Aggiungere logo/contatti azienda nella postilla

### **Certificato Personalizzato (Alternativa)**

1. Creare servizio generazione PDF personalizzato
2. Includere logo azienda, informazioni di contatto
3. Allearlo come documento aggiuntivo al VFU

---

**Nota**: Per confermare al 100%, sarebbe necessario contattare ACI/MIT per verificare se esiste un meccanismo di personalizzazione template non documentato, o se la personalizzazione è disponibile solo per aziende con contratti specifici.

