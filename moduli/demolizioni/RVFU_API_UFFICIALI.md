# RVFU – API ufficiali (OpenAPI)

## ❌ Endpoint NON utilizzabili

Le seguenti URL **NON sono API** e **NON vanno chiamate via software**:

- `/concessionario/veicolo` ❌ (endpoint UI, restituisce 403)
- `/concessionario/*` ❌ (tutti gli endpoint UI)
- qualsiasi endpoint UI del portale ❌

**Restituiscono 403 perché richiedono workflow UI server-side.**

---

## ✅ Endpoint API ufficiali

**Base path:**

```
https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest
```

### 🔍 Ricerca veicoli VFU

```http
GET /demolitori-aci-ws/rest/agenzia/consulta/VFU
```

**Query params:**
- `targa` (string, opzionale)
- `telaio` (string, opzionale)
- `codiceFiscale` (string, opzionale)
- `tipoVeicolo` (string, opzionale)
- `causale` (string, opzionale)
- `statoVFU` (string, opzionale)
- `pageNumber` (number, opzionale)
- `pageSize` (number, opzionale)

**Risposta:**
```json
{
  "content": [
    {
      "idVFU": 123,
      "targa": "AB123CD",
      "tipoVeicolo": "A",
      "marca": "...",
      "modello": "...",
      ...
    }
  ],
  "totalElements": 1,
  "totalPages": 1
}
```

**Auth:**
```
Authorization: Bearer <access_token>
```

**Esempio:**
```javascript
const response = await fetch(
  'https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/agenzia/consulta/VFU?targa=AB123CD&tipoVeicolo=A',
  {
    headers: {
      'Authorization': 'Bearer <access_token>',
      'Accept': 'application/json'
    }
  }
);
```

---

### 📄 Dettaglio veicolo VFU

```http
GET /demolitori-aci-ws/rest/agenzia/VFU/{idVFU}
```

Serve l'`idVFU` ottenuto dalla ricerca.

**Esempio:**
```javascript
const response = await fetch(
  `https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/agenzia/VFU/${idVFU}`,
  {
    headers: {
      'Authorization': 'Bearer <access_token>',
      'Accept': 'application/json'
    }
  }
);
```

---

### 📁 Documenti veicolo

```http
GET /demolitori-aci-ws/rest/agenzia/consulta/documentoVFU/{idVFU}
```

---

## 🔐 Autenticazione

- **OAuth2 / OIDC**
- **NO cookie**
- **NO CDSSO browser**
- **SOLO Bearer Token**

Il token viene ottenuto tramite OAuth2/OIDC flow standard.

---

## 📋 Mappatura: "Dato targa → cosa chiamo?"

### Scenario: "Ho una targa, voglio verificare il veicolo"

**✅ Soluzione corretta:**

```javascript
// 1. Cerca veicolo tramite API ufficiale
const response = await fetch(
  'https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/agenzia/consulta/VFU?targa=AB123CD&tipoVeicolo=A',
  {
    headers: {
      'Authorization': 'Bearer <access_token>',
      'Accept': 'application/json'
    }
  }
);

const data = await response.json();
const veicolo = data.content[0]; // Primo risultato

// 2. Se serve dettaglio completo, usa l'idVFU
if (veicolo?.idVFU) {
  const dettaglio = await fetch(
    `https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/agenzia/VFU/${veicolo.idVFU}`,
    {
      headers: {
        'Authorization': 'Bearer <access_token>',
        'Accept': 'application/json'
      }
    }
  );
}
```

**❌ Soluzione ERRATA (quella che stavamo usando):**

```javascript
// ❌ NON funziona - endpoint UI, restituisce 403
const response = await fetch(
  'https://formazione.ilportaledeltrasporto.it/concessionario/veicolo?targa=AB123CD&tipoVeicolo=A',
  {
    headers: {
      'Authorization': 'Bearer <access_token>',
      'Accept': 'application/json'
    }
  }
);
```

---

## ⚠️ Errori comuni

- ❌ Usare endpoint UI come API → 403 Forbidden
- ❌ Usare cookie di sessione → non supportato
- ❌ Simulare navigazione browser → inutile
- ❌ Usare CDSSO per API → non necessario

---

## 📚 Fonte

- OpenAPI RVFU (RVFU.json)
- Documentazione ufficiale RVFU
