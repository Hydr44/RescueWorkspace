# 📱 Come Accedere al Monitor SDI

**Pagina creata:** `/sdi-monitor`  
**Status:** ✅ Committata e pushato su GitHub

---

## 🌐 Accesso alla Pagina

Una volta che il website è deployato, puoi accedere a:

```
https://tuodominio.com/sdi-monitor
```

---

## 🚀 Deploy Automatico (Vercel)

Se il website è connesso a **Vercel** con deploy automatico:
- ✅ Il deploy dovrebbe partire automaticamente dopo il push
- ⏱️ Tempo tipico: 1-3 minuti
- 📧 Vercel invia notifica email quando il deploy è completato

**Verifica:**
1. Vai su https://vercel.com
2. Controlla il progetto del website
3. Verifica che ci sia un nuovo deploy in corso/completato

---

## 🔧 Deploy Manuale

Se il deploy automatico non funziona, puoi:

### Opzione 1: Deploy da Vercel Dashboard
1. Vai su https://vercel.com
2. Seleziona il progetto
3. Clicca "Redeploy" sull'ultimo deploy

### Opzione 2: Deploy da CLI
```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace/website
vercel --prod
```

---

## 🧪 Test Locale (Prima del Deploy)

Puoi testare localmente:

```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace/website
npm run dev
```

Poi apri: http://localhost:3000/sdi-monitor

**Nota:** L'endpoint API (`/api/sdi-sftp/status`) potrebbe non funzionare localmente se non hai accesso SSH al VPS configurato.

---

## 📋 Checklist

- ✅ Codice committato e pushato su GitHub
- ⏳ Deploy automatico (se configurato)
- ⏳ Verifica accesso a `/sdi-monitor`
- ⏳ Test funzionalità (se necessario)

---

## 🔍 Verifica Deploy

Dopo il deploy, verifica:
1. La pagina `/sdi-monitor` è accessibile
2. L'endpoint `/api/sdi-sftp/status` funziona
3. I dati vengono caricati correttamente
