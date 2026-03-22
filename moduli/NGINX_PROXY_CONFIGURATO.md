# ✅ Nginx Proxy a Vercel - Configurato

**Data**: 2026-01-23  
**Status**: ✅ Completato

---

## 🔧 Configurazione Applicata

Sono state aggiunte le seguenti location blocks nel file `/etc/nginx/sites-available/rentri` per il server `rentri-test.rescuemanager.eu`:

### Endpoint Configurati

1. **`/api/rentri/fir/`** → Proxy a `https://rescuemanager.eu`
   - Timeout: 60 secondi
   - Buffer: 4k

2. **`/api/rentri/ai-validate`** → Proxy a `https://rescuemanager.eu`
   - Timeout: 90 secondi (per operazioni IA lunghe)

3. **`/api/rentri/limiti/alert`** → Proxy a `https://rescuemanager.eu`

4. **`/api/version/check`** → Proxy a `https://rescuemanager.eu`

---

## 📊 Risultato

### Prima
- Client Desktop → Vercel (direttamente)
- **Edge Requests**: Una per ogni client
- **Costi**: Massimi

### Dopo
- Client Desktop → VPS → Vercel
- **Edge Requests**: Vercel vede solo il VPS come client
- **Costi**: Ridotti significativamente

---

## ✅ Verifica

```bash
# Test configurazione
ssh -i ~/.ssh/id_ed25519_vps_sdi root@217.154.118.37 "nginx -t"

# Ricarica Nginx
ssh -i ~/.ssh/id_ed25519_vps_sdi root@217.154.118.37 "systemctl reload nginx"

# Test endpoint
curl -k https://rentri-test.rescuemanager.eu/api/rentri/fir/trasmetti
```

---

## 📝 Note

- Le location sono state inserite **prima** della location `/api/rentri/` generica
- Questo garantisce che le location specifiche abbiano priorità
- Tutti gli endpoint ora passano attraverso il VPS prima di arrivare a Vercel
- Il backup della configurazione originale è stato salvato in `/etc/nginx/sites-available/rentri.backup.*`

---

## 🔄 Prossimi Passi

1. ✅ Configurazione Nginx completata
2. ✅ Desktop app già configurata per usare `rentri-test.rescuemanager.eu`
3. ⏳ Monitorare i costi Vercel per verificare la riduzione
4. ⏳ Considerare di spostare gli endpoint su server Express sul VPS per eliminare completamente i costi Vercel
