# 🔧 Correzione Orario VPS

**Data:** 14 gennaio 2026

---

## 🐛 Problema Identificato

**Errore 00105:** "Il riferimento temporale della firma digitale apposta non è coerente"

**Causa probabile:** Orario VPS non sincronizzato con SDI

**Se l'orario della VPS è avanti rispetto a SDI:**
- OpenSSL firma con `signingTime` = ora VPS (es. 17:37)
- SDI riceve file con data ricezione = ora SDI (es. 16:58)
- Errore 00105: signingTime (17:37) > data ricezione (16:58)

---

## ✅ Verifica Orario

**Orario PC utente:** [Da verificare]  
**Orario VPS:** [Da verificare]  
**Differenza:** [Da calcolare]

---

## 🔧 Correzione

### Opzione 1: Sincronizzazione NTP automatica
```bash
timedatectl set-ntp true
```

### Opzione 2: Sincronizzazione manuale
```bash
ntpdate pool.ntp.org
```

---

## ⏳ Prossimi Passi

1. ⏳ Verificare differenza orario
2. ⏳ Sincronizzare orario VPS
3. ⏳ Testare nuova fattura
4. ⏳ Verificare se errore 00105 si risolve

---

**Status:** ⏳ Verifica in corso
