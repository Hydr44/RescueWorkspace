# 🔍 Confronto RVFU, RENTRI e SDI

## Perché RVFU e RENTRI funzionano ma SDI no?

### ✅ RVFU - Funziona

**Come funziona**:
- **NON passa da Vercel**
- Usa **BrowserWindow/IPC** di Electron
- Chiama **direttamente** il server RVFU (`https://formazione.ilportaledeltrasporto.it`)
- Gestito in `electron/ipc.js` con `rvfu:api-call`

**Codice**:
```javascript
// electron/ipc.js
ipcMain.handle('rvfu:api-call', async (event, params) => {
  // Usa BrowserWindow per gestire CDSSO
  // Chiama direttamente il server RVFU
});
```

**Endpoint**: Diretto al server RVFU, non passa da Vercel.

---

### ✅ RENTRI - Funziona

**Come funziona**:
- **Passa da Vercel** (`https://rescuemanager.eu/api/rentri/...`)
- Le route esistono già su Vercel da tempo
- Esempi:
  - `/api/rentri/registri`
  - `/api/rentri/registri/[id]/movimenti`
  - `/api/rentri/fir/trasmetti`
  - etc.

**Codice**:
```javascript
// src/pages/RifiutiMovimenti.jsx
const apiUrl = import.meta.env.VITE_API_URL || 'https://rescuemanager.eu';
const response = await fetch(`${apiUrl}/api/rentri/registri/${id}/movimenti`, {
  method: 'POST',
  // ...
});
```

**Endpoint**: `https://rescuemanager.eu/api/rentri/*` (route esistenti su Vercel)

---

### ❌ SDI - NON Funziona

**Come funziona (dovrebbe)**:
- **Dovrebbe passare da Vercel** (`https://rescuemanager.eu/api/sdi-sftp/send`)
- La route è stata **creata di recente**
- La route **non è ancora deployata** su Vercel
- Quindi Vercel dà **404 Not Found**

**Codice**:
```javascript
// src/lib/sdi.js
const apiUrl = import.meta.env.VITE_API_URL || 'https://rescuemanager.eu';
const endpoint = `${apiUrl}/api/sdi-sftp/send`;
```

**Endpoint**: `https://rescuemanager.eu/api/sdi-sftp/send` (route NUOVA, non deployata)

---

## Conclusione

| Modulo | Funziona? | Passa da Vercel? | Route Deployata? |
|--------|-----------|------------------|------------------|
| **RVFU** | ✅ Sì | ❌ No (BrowserWindow) | N/A |
| **RENTRI** | ✅ Sì | ✅ Sì | ✅ Sì (da tempo) |
| **SDI** | ❌ No | ✅ Sì | ❌ No (nuova) |

**SDI non funziona perché la route `/api/sdi-sftp/send` è stata creata ma non ancora deployata su Vercel.**

**Soluzione**: Deployare la route su Vercel (push su GitHub o redeploy manuale).

