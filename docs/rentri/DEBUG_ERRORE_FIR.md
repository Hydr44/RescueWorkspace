# 🐛 Debug Errore Trasmissione FIR

## Dove Vedere l'Errore

### 1. Console Browser (Desktop App)
```
Cmd+Option+I (o F12)
→ Tab "Console"
→ Cerca "[FIR]" o "[RENTRI-FIR]"
→ Copia qui tutto l'errore rosso
```

### 2. Network Tab (Desktop App)
```
Cmd+Option+I → Tab "Network"
→ Cerca richiesta "trasmetti"
→ Click → Tab "Response"
→ Copia la risposta
```

### 3. Logs Vercel (Backend)
```
https://vercel.com/hydr44s-projects/web
→ Click ultimo deployment
→ Tab "Functions"
→ Cerca "/api/rentri/fir/trasmetti"
→ Espandi log
→ Cerca [RENTRI-FIR] o [RENTRI-JWT]
```

---

## Possibili Errori

### Errore Lato Client
```
- TypeError: ... is not a function
- Cannot read property ... of undefined
- Fetch failed
```

### Errore Lato Server
```
- 400: Payload non valido
- 401: Autenticazione fallita
- 500: Errore interno server
```

### Errore Build
```
- Vercel build failed
- Syntax error in TypeScript
```

---

## 🔍 Azioni

1. **Apri DevTools** (Cmd+Option+I)
2. **Copia tutto l'errore** dalla console
3. **Incolla qui**

Oppure:

4. **Screenshot** della console con l'errore
5. **Condividilo**

---

**Dammi l'errore completo dalla console browser!** 🔍

