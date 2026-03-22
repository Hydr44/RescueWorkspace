# 📚 Spiegazione "File di Quadratura"

**Errore SDI:** "File di Quadratura non presente o mancanza dei documenti di fatturazione"

---

## 🔍 Cosa Significa "File di Quadratura"

Dai manuali SDI:

1. **Servizio di Quadratura** (SDICoop-Trasmissione):
   - È un **servizio separato** per richiedere report di sintesi dei file trasmessi
   - NON è un file che dobbiamo inviare nel ZIP
   - È un report CSV che SDI genera su richiesta per verificare la quadratura dei flussi

2. **Errore "File di Quadratura non presente":**
   - È un **errore interno di SDI**
   - Significa che SDI **non riesce a elaborare correttamente il supporto** (ZIP)
   - Quindi SDI **non può generare il suo file di quadratura interno**
   - L'errore indica che c'è un problema nel formato/struttura del supporto che impedisce l'elaborazione

---

## 💡 Interpretazione Errore

L'errore "File di Quadratura non presente" significa:

**SDI non riesce a:**
1. Decifrare il supporto
2. Verificare la firma
3. Estrarre i file XML
4. Elaborare i documenti di fatturazione

**Quindi SDI non può:**
- Generare il suo file di quadratura interno
- Processare le fatture

---

## 🎯 Conclusione

Il "File di Quadratura" NON è qualcosa che dobbiamo includere nel ZIP. È un file interno che SDI genera DOPO aver elaborato correttamente il supporto.

L'errore indica che c'è un problema nel formato/struttura del supporto che impedisce a SDI di elaborarlo.

---

## 📞 Prossimo Passo

Chiedere assistenza SDI per capire esattamente quale struttura/formato è richiesto per il supporto.
