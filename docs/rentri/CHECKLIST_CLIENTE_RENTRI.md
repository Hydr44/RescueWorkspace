# ✅ CHECKLIST CONFIGURAZIONE RENTRI - Cliente

**Cliente**: _______________________  
**Data**: _____/_____/_____  
**Ambiente**: ☐ DEMO  ☐ PRODUZIONE

---

## 📋 FASE 1: PORTALE RENTRI (Completato dal cliente)

### 1. Accesso Portale
- [ ] Accesso a https://portale.rentri.gov.it
- [ ] Ambiente selezionato (DEMO/PRODUZIONE)
- [ ] Login con SPID/CIE funzionante

---

### 2. Accreditamento Operatore
- [ ] Menu → Area Operatori → Accreditamento
- [ ] Dati operatore compilati:
  - CF/P.IVA: ___________________________
  - Denominazione: ___________________________
  - Sede Legale: ___________________________
  - PEC: ___________________________
- [ ] Accreditamento confermato (DEMO: immediato, PROD: 1-5 giorni)

---

### 3. Unità Locale Creata
- [ ] Menu → Anagrafica → Unità Locali → Aggiungi
- [ ] Metodo: ☐ Importa da RI  ☐ Manuale
- [ ] Indirizzo compilato
- [ ] Attività selezionate:
  - [ ] Produzione
  - [ ] Trasporto
  - [ ] Recupero
  - [ ] Smaltimento
  - [ ] Intermediazione
- [ ] **num_iscr_sito assegnato**: _______________________
  - **⚠️ COPIARE E SALVARE!**

---

### 4. Certificato .p12 Scaricato
- [ ] Menu → Interoperabilità → Gestione certificati
- [ ] Richiedi nuovo certificato → Certificato di dominio RENTRI
- [ ] File .p12 scaricato: ___________________________
- [ ] **Password annotata**: _______________________
  - **⚠️ CUSTODIRE IN MODO SICURO!**

---

### 5. Blocco Virtuale FIR Creato
- [ ] Menu → Interoperabilità → Gestione blocchi virtuali
- [ ] Nuovo Blocco creato
- [ ] **Codice blocco**: _________ (4-6 lettere, es: ABCD)
- [ ] Descrizione: ___________________________
- [ ] Associato a unità locale: ___________________________
- [ ] Stato: Attivo

---

## 📋 FASE 2: RESCUEMANAGER (Completato da supporto tecnico)

### 6. Upload Certificato in RescueManager
- [ ] App RescueManager aperta
- [ ] Organizzazione selezionata: ___________________________
- [ ] Menu → Rifiuti RENTRI → Dashboard → Certificati
- [ ] Certificato .p12 caricato
- [ ] Dati inseriti:
  - CF Operatore: ___________________________
  - Ragione Sociale: ___________________________
  - Password: ___________________________
  - Ambiente: ☐ Demo  ☐ Produzione
- [ ] Upload completato con successo

---

### 7. Configurazione num_iscr_sito nel DB
- [ ] Accesso a Supabase dashboard
- [ ] SQL Editor → Esegui query:
```sql
UPDATE rentri_org_certificates
SET num_iscr_sito = '_________________'  -- num_iscr_sito da punto 3
WHERE cf_operatore = '_________________'; -- CF da punto 2
```
- [ ] Verifica eseguita:
```sql
SELECT cf_operatore, num_iscr_sito, is_active
FROM rentri_org_certificates
WHERE cf_operatore = '_________________';
```
- [ ] Risultato: num_iscr_sito popolato, is_active = true

---

### 8. Test Trasmissione FIR
- [ ] App RescueManager → Rifiuti RENTRI → Formulari
- [ ] Nuovo Formulario
- [ ] "Riempi Dati Test" (per test rapido)
- [ ] Salva
- [ ] Trasmetti a RENTRI
- [ ] Attesa 10-30 secondi
- [ ] Alert ricevuto: "✅ Numero FIR RENTRI: _________-______-__"
- [ ] Numero FIR visibile nella lista
- [ ] **PRIMO FIR TRASMESSO CON SUCCESSO!** 🎉

---

## ✅ CONFIGURAZIONE COMPLETATA

**Firma cliente**: _______________________  
**Firma tecnico**: _______________________  
**Data**: _____/_____/_____

---

## 📞 CONTATTI SUPPORTO

### RENTRI
- Portale: https://supporto.rentri.gov.it
- Email: techref@rentri.it

### RescueManager
- Email: support@rescuemanager.eu
- Tel: [da definire]

---

## 📝 NOTE AGGIUNTIVE

_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________



