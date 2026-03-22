# 🔍 Verifica DNS - Vercel vs VPS

**Data**: 2026-01-23  
**Scopo**: Capire se `rentri-test.rescuemanager.eu` punta a Vercel o VPS

---

## 🔍 VERIFICA IMMEDIATA

### Comando da Eseguire

```bash
# Verifica DNS
nslookup rentri-test.rescuemanager.eu
nslookup api.rescuemanager.eu
nslookup rescuemanager.eu

# Test endpoint
curl -I https://rentri-test.rescuemanager.eu/api/maintenance/status
curl -I https://rescuemanager.eu/api/maintenance/status
```

---

## 📊 POSSIBILI SCENARI

### Scenario 1: `rentri-test.rescuemanager.eu` punta a Vercel ❌

**Problema**: Tutte le chiamate vanno a Vercel anche se dovrebbero andare al VPS.

**Soluzione**: 
- Cambiare DNS per puntare al VPS (217.154.118.37)
- OPPURE cambiare URL nel codice per usare IP diretto o altro dominio VPS

---

### Scenario 2: `rentri-test.rescuemanager.eu` punta a VPS, ma route `/api/*` non esistono ✅

**Problema**: Il dominio punta al VPS, ma le route `/api/maintenance/status` e `/api/monitoring/heartbeat` non sono configurate su Nginx VPS, quindi vengono proxyate a Vercel.

**Soluzione**:
1. Creare endpoint su VPS per queste route
2. Configurare Nginx per gestirle
3. OPPURE cambiare URL nel codice per usare route VPS esistenti

---

### Scenario 3: `rentri-test.rescuemanager.eu` punta a VPS e route esistono ✅

**Problema**: Allora il problema è che ci sono altre chiamate che vanno a Vercel, o il polling è troppo frequente.

**Soluzione**:
- Ridurre frequenza polling (già fatto)
- Verificare log Vercel per vedere quali route generano più richieste

---

## 🎯 AZIONE IMMEDIATA

**Eseguire questi comandi per capire la situazione**:

```bash
# 1. Verifica DNS
nslookup rentri-test.rescuemanager.eu
# Se punta a Vercel (IP tipo 76.76.21.x o simile) → PROBLEMA
# Se punta a VPS (217.154.118.37) → OK

# 2. Test endpoint
curl -v https://rentri-test.rescuemanager.eu/api/maintenance/status
# Se 404 → Route non esiste su VPS
# Se 200 → Route esiste

# 3. Verifica header response
curl -I https://rentri-test.rescuemanager.eu/api/maintenance/status | grep -i server
# Se "Vercel" → Va a Vercel
# Se "nginx" → Va a VPS
```

---

## 📋 DOPO LA VERIFICA

A seconda del risultato:

1. **Se punta a Vercel**: Cambiare DNS o URL nel codice
2. **Se punta a VPS ma route non esistono**: Creare route su VPS
3. **Se tutto punta a VPS**: Verificare altre chiamate che vanno a Vercel

---

**Esegui i comandi sopra e condividi i risultati per procedere con la soluzione corretta.**
