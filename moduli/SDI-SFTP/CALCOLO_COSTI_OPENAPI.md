# 💰 Calcolo Costi OpenAPI.it - Scenari Reali

**Data:** 19 gennaio 2026  
**Costo per richiesta:** €0,050  
**Ottimizzazioni implementate:** Cache database (30 giorni) + Verifica cliente esistente

---

## 📊 SCENARIO 1: 100 Aziende

### Utilizzo Stimato
- **100 aziende**
- **10-20 richieste al giorno per azienda**
- **30 giorni al mese**

### Calcolo Richieste

#### Caso A: 10 richieste/giorno per azienda
- **Richieste/giorno:** 100 aziende × 10 = **1.000 richieste/giorno**
- **Richieste/mese:** 1.000 × 30 = **30.000 richieste/mese**

#### Caso B: 20 richieste/giorno per azienda
- **Richieste/giorno:** 100 aziende × 20 = **2.000 richieste/giorno**
- **Richieste/mese:** 2.000 × 30 = **60.000 richieste/mese**

---

### 💵 Costi SENZA Ottimizzazioni

#### Caso A (10 richieste/giorno):
- **Costo/giorno:** 1.000 × €0,050 = **€50,00/giorno**
- **Costo/mese:** 30.000 × €0,050 = **€1.500,00/mese**
- **Costo/anno:** €1.500 × 12 = **€18.000,00/anno** 🔴

#### Caso B (20 richieste/giorno):
- **Costo/giorno:** 2.000 × €0,050 = **€100,00/giorno**
- **Costo/mese:** 60.000 × €0,050 = **€3.000,00/mese**
- **Costo/anno:** €3.000 × 12 = **€36.000,00/anno** 🔴🔴

---

### ✅ Costi CON Ottimizzazioni (Cache + Verifica Cliente)

**Riduzione stimata:** 70-85% delle richieste evitate

#### Caso A (10 richieste/giorno):
- **Richieste effettive/mese:** 30.000 × (15-30%) = **4.500 - 9.000 richieste/mese**
- **Costo/mese:** 4.500-9.000 × €0,050 = **€225,00 - €450,00/mese**
- **Costo/anno:** €2.700 - €5.400/anno ✅

**Risparmio:** €12.600 - €15.300/anno (70-85%)

#### Caso B (20 richieste/giorno):
- **Richieste effettive/mese:** 60.000 × (15-30%) = **9.000 - 18.000 richieste/mese**
- **Costo/mese:** 9.000-18.000 × €0,050 = **€450,00 - €900,00/mese**
- **Costo/anno:** €5.400 - €10.800/anno ✅

**Risparmio:** €25.200 - €30.600/anno (70-85%)

---

## 📊 SCENARIO 2: 10 Aziende

### Utilizzo Stimato
- **10 aziende**
- **10-20 richieste al giorno per azienda**
- **30 giorni al mese**

### Calcolo Richieste

#### Caso A: 10 richieste/giorno per azienda
- **Richieste/giorno:** 10 aziende × 10 = **100 richieste/giorno**
- **Richieste/mese:** 100 × 30 = **3.000 richieste/mese**

#### Caso B: 20 richieste/giorno per azienda
- **Richieste/giorno:** 10 aziende × 20 = **200 richieste/giorno**
- **Richieste/mese:** 200 × 30 = **6.000 richieste/mese**

---

### 💵 Costi SENZA Ottimizzazioni

#### Caso A (10 richieste/giorno):
- **Costo/giorno:** 100 × €0,050 = **€5,00/giorno**
- **Costo/mese:** 3.000 × €0,050 = **€150,00/mese**
- **Costo/anno:** €150 × 12 = **€1.800,00/anno** 🔴

#### Caso B (20 richieste/giorno):
- **Costo/giorno:** 200 × €0,050 = **€10,00/giorno**
- **Costo/mese:** 6.000 × €0,050 = **€300,00/mese**
- **Costo/anno:** €300 × 12 = **€3.600,00/anno** 🔴

---

### ✅ Costi CON Ottimizzazioni (Cache + Verifica Cliente)

**Riduzione stimata:** 70-85% delle richieste evitate

#### Caso A (10 richieste/giorno):
- **Richieste effettive/mese:** 3.000 × (15-30%) = **450 - 900 richieste/mese**
- **Costo/mese:** 450-900 × €0,050 = **€22,50 - €45,00/mese**
- **Costo/anno:** €270 - €540/anno ✅

**Risparmio:** €1.260 - €1.530/anno (70-85%)

#### Caso B (20 richieste/giorno):
- **Richieste effettive/mese:** 6.000 × (15-30%) = **900 - 1.800 richieste/mese**
- **Costo/mese:** 900-1.800 × €0,050 = **€45,00 - €90,00/mese**
- **Costo/anno:** €540 - €1.080/anno ✅

**Risparmio:** €2.520 - €3.060/anno (70-85%)

---

## 📈 Tabella Riepilogativa

| Scenario | Aziende | Richieste/Giorno | Costo/Mese SENZA | Costo/Mese CON | Risparmio/Mese | Costo/Anno CON |
|----------|---------|------------------|------------------|----------------|----------------|----------------|
| **1A** | 100 | 10 | €1.500 | €225-€450 | €1.050-€1.275 | €2.700-€5.400 |
| **1B** | 100 | 20 | €3.000 | €450-€900 | €2.100-€2.550 | €5.400-€10.800 |
| **2A** | 10 | 10 | €150 | €22,50-€45 | €105-€127,50 | €270-€540 |
| **2B** | 10 | 20 | €300 | €45-€90 | €210-€255 | €540-€1.080 |

---

## 🎯 Come Funzionano le Ottimizzazioni

### 1. **Cache Database (30 giorni)**
- Prima chiamata per P.IVA: chiama API
- Chiamate successive (entro 30 giorni): usa cache → **€0,00**
- **Risparmio:** ~60-70% delle richieste

### 2. **Verifica Cliente Esistente**
- Se cliente già nel database: usa dati database → **€0,00**
- Solo clienti nuovi chiamano API
- **Risparmio:** ~20-30% delle richieste

### 3. **Cache localStorage (24 ore)**
- Stessa sessione: usa cache locale → **€0,00**
- **Risparmio:** ~10-15% delle richieste

**Totale risparmio:** 70-85% delle richieste evitate

---

## 💡 Strategie Aggiuntive per Ridurre Costi

### 1. **Pulsante "Recupera Dati" (Invece di Automatico)**
- Non chiamare API automaticamente su `onBlur`
- Mostrare pulsante "Recupera Dati" quando necessario
- **Risparmio aggiuntivo:** 30-40% delle richieste

### 2. **Alternative Gratuite Prima di OpenAPI**
- **Agenzia Entrate API** (GRATIS) - per verifica P.IVA italiana
- **VIES** (GRATIS) - per P.IVA comunitarie
- **IPA** (GRATIS) - per Pubblica Amministrazione
- Chiamare OpenAPI solo se dati mancanti
- **Risparmio aggiuntivo:** 20-30% delle richieste

### 3. **Cache Condivisa tra Aziende**
- Se più aziende verificano stessa P.IVA, condividere cache
- **Risparmio aggiuntivo:** 10-15% delle richieste

---

## 🚨 Costi Critici (Senza Ottimizzazioni)

### ⚠️ 100 Aziende × 20 richieste/giorno
- **€3.000/mese** = **€36.000/anno** 🔴🔴
- **Non sostenibile** per la maggior parte delle aziende

### ✅ Con Ottimizzazioni
- **€450-€900/mese** = **€5.400-€10.800/anno** ✅
- **Sostenibile** e gestibile

---

## 📝 Note Importanti

1. **Cache Database:**
   - Valida per 30 giorni
   - Pulizia automatica cache scaduta
   - Dati pubblici (P.IVA, ragione sociale) - GDPR compliant

2. **Monitoraggio:**
   - Tracciare numero chiamate API effettive
   - Alert se supera soglia (es. 50 richieste/mese per azienda)
   - Dashboard costi in tempo reale

3. **Scaling:**
   - Con 100+ aziende, considerare:
     - Cache condivisa tra aziende
     - Rate limiting per azienda
     - Piani OpenAPI.it con sconti volume

---

## 🎯 Raccomandazioni

### Per 10 Aziende:
- ✅ **Ottimizzazioni implementate sono sufficienti**
- ✅ Costo gestibile: €270-€1.080/anno
- ✅ Nessuna azione aggiuntiva necessaria

### Per 100 Aziende:
- ✅ **Ottimizzazioni implementate sono essenziali**
- ⚠️ Costo ancora significativo: €5.400-€10.800/anno
- 💡 **Raccomandato:**
  1. Implementare pulsante "Recupera Dati" (non automatico)
  2. Integrare alternative gratuite (Agenzia Entrate, VIES)
  3. Cache condivisa tra aziende
  4. Monitoraggio costi in tempo reale
  5. Considerare piani OpenAPI.it con sconti volume

---

**Status:** ✅ Calcoli completi - Pronto per decisioni strategiche
