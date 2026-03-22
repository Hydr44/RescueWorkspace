# ✅ Fix Cookie Cross-Domain - iPlanetDirectoryPro

**Data:** 19 gennaio 2026  
**Problema:** Cookie `iPlanetDirectoryPro` non disponibile nella pagina API

---

## 🔴 Problema Identificato

Dai log:
```
[RVFU API Proxy] 🔍 Cookie disponibili nella pagina: {
  hasIPlanetCookie: false,  ← PROBLEMA!
  url: 'https://formazione.ilportaledeltrasporto.it/',
  origin: 'https://formazione.ilportaledeltrasporto.it'
}
```

**Causa:**
- Il cookie `iPlanetDirectoryPro` è impostato per `ssoformazione.ilportaledeltrasporto.it`
- La pagina della finestra persistente è su `formazione.ilportaledeltrasporto.it`
- I cookie non vengono condivisi tra domini diversi (anche se sono sottodomini)

---

## ✅ Fix Applicato

### Impostazione Cookie Multi-Dominio

Il cookie viene ora impostato per:
1. **Dominio SSO:** `ssoformazione.ilportaledeltrasporto.it`
2. **Dominio API:** `formazione.ilportaledeltrasporto.it`
3. **Dominio Parent:** `.ilportaledeltrasporto.it` (con punto iniziale per condivisione cross-subdomain)

### Codice

```javascript
// Cookie per dominio SSO
await defaultSession.cookies.set({
  url: `https://${ssoDomain}/sso/`,
  name: 'iPlanetDirectoryPro',
  value: iPlanetCookie.value,
  domain: ssoDomain,
  path: '/',
  secure: true,
  httpOnly: true,
});

// Cookie per dominio API
const apiDomain = 'formazione.ilportaledeltrasporto.it';
await defaultSession.cookies.set({
  url: `https://${apiDomain}/`,
  name: 'iPlanetDirectoryPro',
  value: iPlanetCookie.value,
  domain: apiDomain,
  path: '/',
  secure: true,
  httpOnly: true,
});

// Cookie per dominio parent (cross-subdomain)
await defaultSession.cookies.set({
  url: `https://ilportaledeltrasporto.it/`,
  name: 'iPlanetDirectoryPro',
  value: iPlanetCookie.value,
  domain: '.ilportaledeltrasporto.it', // Punto iniziale per cross-subdomain
  path: '/',
  secure: true,
  httpOnly: true,
});
```

---

## 🧪 Test

1. **Riavvia l'app** e fai login RVFU
2. **Prova a cercare un veicolo** (targa `VA054AJ`)
3. **Controlla i log:**
   - `[RVFU API Proxy] 🔍 Cookie disponibili nella pagina:`
   - Dovrebbe mostrare `hasIPlanetCookie: true`

---

## 📝 Note

- Il cookie con dominio parent (`.ilportaledeltrasporto.it`) dovrebbe essere condiviso tra tutti i sottodomini
- Se il dominio parent non funziona, il cookie per `formazione.ilportaledeltrasporto.it` dovrebbe comunque funzionare
- I cookie `httpOnly` vengono inviati automaticamente dal browser anche se non visibili in `document.cookie`

---

**Status:** ✅ Fix applicato - Test necessario
