# Test Pratici da Eseguire

## 🎯 Obiettivo
Gli agenti devono eseguire test **pratici e reali** sul sistema, non solo analisi teorica.

## ✅ Test Backend

### 1. Test Login & Auth
- [ ] Verificare che esistano utenti nel DB (`auth.users`)
- [ ] Testare login con credenziali valide
- [ ] Testare login con credenziali invalide
- [ ] Verificare JWT token generation
- [ ] Testare RLS policies su `organizations` table

### 2. Test CRUD Trasporti
- [ ] Creare un nuovo trasporto via API
- [ ] Leggere lista trasporti di un'organizzazione
- [ ] Aggiornare stato trasporto
- [ ] Eliminare trasporto (soft delete)
- [ ] Verificare RLS: user A non vede trasporti di org B

### 3. Test Integrazioni Governative
- [ ] **SDI**: Generare XML fattura e validarlo
- [ ] **SDI**: Testare firma digitale P7M
- [ ] **RENTRI**: Creare formulario test
- [ ] **RENTRI**: Verificare JWT e chiamata API demo
- [ ] **RVFU**: Testare login OAuth2 (se disponibile)

### 4. Test Database
- [ ] Contare record in tabelle principali
- [ ] Verificare foreign keys e relazioni
- [ ] Testare performance query lente (EXPLAIN ANALYZE)
- [ ] Verificare indici mancanti

## 🖥️ Test Desktop App

### 1. Test UI/UX
- [ ] Aprire tutte le 58 pagine e verificare rendering
- [ ] Testare navigazione tra pagine
- [ ] Verificare form validation
- [ ] Testare dark mode

### 2. Test Funzionalità
- [ ] Login desktop app
- [ ] Sync offline/online
- [ ] Cache SQLite locale
- [ ] IPC handlers (electron/ipc.js)

### 3. Test Performance
- [ ] Memory leak check
- [ ] Bundle size analysis
- [ ] Startup time
- [ ] React warnings in console

## 🌐 Test Website

### 1. Test API Routes
- [ ] Testare tutte le 150+ API routes
- [ ] Verificare autenticazione JWT
- [ ] Testare rate limiting
- [ ] Verificare CORS

### 2. Test UI
- [ ] Lighthouse score (Performance, SEO, A11y)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Form submission
- [ ] Error handling

## 📱 Test Mobile App

### 1. Test Funzionalità
- [ ] Login autista
- [ ] Scansione QR code
- [ ] Geolocalizzazione
- [ ] Notifiche push

### 2. Test Performance
- [ ] Bundle size
- [ ] Startup time
- [ ] Offline behavior
- [ ] Crash report

## 🔒 Test Security

### 1. RLS Bypass Test
- [ ] Tentare accesso cross-organization
- [ ] Testare policy su ogni tabella
- [ ] Verificare che admin non bypassa RLS

### 2. SQL Injection
- [ ] Testare input form con payload SQL
- [ ] Verificare prepared statements

### 3. XSS
- [ ] Testare input con script tags
- [ ] Verificare sanitization

### 4. Auth Bypass
- [ ] Tentare accesso senza JWT
- [ ] Testare JWT scaduto
- [ ] Testare JWT manipolato

## 📊 Output Atteso

Ogni test deve produrre:
1. **Status**: ✅ Pass / ❌ Fail
2. **Dettagli**: Cosa è stato testato esattamente
3. **Risultato**: Output del test (query result, API response, etc.)
4. **Screenshot/Log**: Se applicabile
5. **Fix suggerito**: Se il test fallisce

## 🎯 Esempio di Test Completo

```json
{
  "test": "Login con credenziali valide",
  "status": "✅ Pass",
  "details": {
    "email": "test@example.com",
    "password": "***",
    "endpoint": "POST /api/auth/login"
  },
  "result": {
    "statusCode": 200,
    "token": "eyJhbGc...",
    "user": {
      "id": "123",
      "email": "test@example.com"
    }
  },
  "duration": "234ms"
}
```
