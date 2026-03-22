# 📋 RENTRI FIR - Workflow Stati Automatici

**Fonte**: Documentazione RENTRI API v1.0  
**Data**: 3 Dicembre 2025

---

## 🔄 Come Funzionano gli Stati FIR in RENTRI

### Stati Gestiti AUTOMATICAMENTE da RENTRI

RENTRI ha **15+ stati** che cambiano automaticamente in base alle azioni:

```
1. InserimentoQuantita
   ↓ (aggiungi quantità via API)
2. InserimentoTrasportoIniziale
   ↓ (aggiungi dati trasporto via API)
3. FirmaProduttoreTrasportatoreIniziale
   ↓ (firma produttore via API)
   ↓ (firma trasportatore via API)
4. InserimentoAccettazione
   ↓ (destinatario inserisce accettazione via API)
5. FirmaAccettazione
   ↓ (destinatario firma via API)
6. Accettato ✅
```

**Gli stati NON si cambiano manualmente!**  
**Si cambiano tramite azioni via API RENTRI!**

---

## 🎯 Nel Nostro Sistema

### Fase 1: Locale (ORA - Bozza)
```
✅ Stato: "bozza"
✅ FIR salvato solo nel nostro DB
✅ Modificabile liberamente
✅ NON ancora su RENTRI
```

### Fase 2: Trasmissione (DA IMPLEMENTARE)
```
Action: Click pulsante "Trasmetti a RENTRI"

Backend fa:
1. POST /formulari/v1.0/ → Crea FIR su RENTRI
2. RENTRI risponde con:
   - numero_fir (assegnato da RENTRI)
   - stato: "InserimentoQuantita" o simile
3. Salviamo nel DB:
   - rentri_id
   - rentri_numero
   - stato: "trasmesso"
```

### Fase 3: Firma Produttore (DA IMPLEMENTARE)
```
Action: Click "Firma come Produttore"

Backend fa:
1. Genera firma XAdES con certificato .p12
2. POST /formulari/v1.0/{numero}/firma
3. RENTRI cambia stato automaticamente
4. GET /formulari/v1.0/{numero} → Leggi nuovo stato
5. Aggiorniamo DB locale
```

### Fase 4: Firma Trasportatore (DA IMPLEMENTARE)
```
Action: Trasportatore firma
Backend: Stesso processo punto 3
RENTRI: Cambia stato automaticamente
```

### Fase 5: Accettazione Destinatario (DA IMPLEMENTARE)
```
Action: Destinatario accetta
Backend:
1. POST /formulari/v1.0/{numero}/accettazione
2. RENTRI → stato: "FirmaAccettazione"
3. Destinatario firma
4. RENTRI → stato: "Accettato"
5. Aggiorniamo DB: stato = "accettato"
```

---

## 🔧 Implementazione Corretta

### Database - Aggiungi Campo rentri_stato

```sql
-- Distinguiamo stato nostro (semplificato) da stato RENTRI (dettagliato)
ALTER TABLE rentri_formulari 
  ADD COLUMN IF NOT EXISTS rentri_stato VARCHAR(100);

COMMENT ON COLUMN rentri_formulari.stato IS 
  'Stato semplificato per UI: bozza, trasmesso, accettato, rifiutato, annullato';

COMMENT ON COLUMN rentri_formulari.rentri_stato IS 
  'Stato dettagliato da RENTRI API: InserimentoQuantita, FirmaProduttore, Accettato, etc.';
```

### UI - Badge Stato Read-Only

```javascript
// Nel form, mostra solo lo stato (non modificabile)
<div className="stato-badge">
  {form.stato === "bozza" && "📝 Bozza - Locale"}
  {form.stato === "trasmesso" && "📤 Trasmesso a RENTRI"}
  {form.stato === "accettato" && "✅ Accettato"}
</div>

// NON dropdown select!
```

### UI - Pulsanti Azioni

```javascript
// Invece di dropdown, pulsanti azione:
{form.stato === "bozza" && (
  <button onClick={trasmittiARentri}>
    📤 Trasmetti a RENTRI
  </button>
)}

{form.stato === "trasmesso" && form.rentri_stato === "FirmaProduttore" && (
  <button onClick={firmaComeProdutt}>
    ✍️ Firma come Produttore
  </button>
)}
```

---

## 🎯 Workflow Completo da Implementare

### Backend API Necessario

```javascript
// website/src/app/api/rentri/fir/trasmetti/route.ts
export async function POST(req) {
  const { fir_id } = await req.json();
  
  // 1. Carica FIR dal DB
  const fir = await loadFir(fir_id);
  
  // 2. Carica certificato org
  const cert = await getCertificato(fir.org_id);
  
  // 3. Genera JWT
  const jwt = generateRentriJWT(cert);
  
  // 4. POST a RENTRI
  const response = await fetch('https://rentri-test.rescuemanager.eu/formulari/v1.0/', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${jwt}` },
    body: JSON.stringify(firPayload)
  });
  
  const rentri = await response.json();
  
  // 5. Aggiorna DB
  await supabase
    .from('rentri_formulari')
    .update({
      stato: 'trasmesso',
      rentri_id: rentri.id,
      rentri_numero: rentri.numero_fir,
      rentri_stato: rentri.stato
    })
    .eq('id', fir_id);
    
  return { success: true, rentri_stato: rentri.stato };
}
```

---

## 📋 Action Plan

### Ora (Immediato)
```
1. ✅ Rimuovo dropdown editabile
2. ✅ Metto badge read-only
3. ✅ Stato rimane "bozza" automaticamente
4. ⏳ Applica DISABLE RLS
5. ⏳ Testa creazione FIR
```

### Fase 3 (Prossima sessione)
```
1. Backend API trasmissione
2. Backend API firma
3. Backend polling stato
4. UI pulsanti azioni
5. Sincronizzazione automatica stati
```

---

**Hai ragione al 100%! Gli stati devono essere automatici!** ✅

**Per ora lasciamo "bozza" e implementiamo API complete dopo!**

**Applica DISABLE RLS e testa - poi continuiamo con API!** 🚀
