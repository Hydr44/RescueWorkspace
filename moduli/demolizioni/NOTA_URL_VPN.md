# 🔧 URL RVFU con VPN

## Problema ERR_NAME_NOT_RESOLVED

L'errore `ERR_NAME_NOT_RESOLVED` si verifica quando il sistema non riesce a risolvere il DNS dell'hostname.

## URL Configurati

### Ambiente Formazione

**Codice attuale**: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it`

**Modifiche applicate**:
- ✅ Rimossa porta `:80` esplicita (HTTP usa porta 80 di default)
- URL interno con VPN: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it`
- URL pubblico (senza VPN): `https://formazione.ilportaledeltrasporto.it`

## Checklist Risoluzione Problema

Se la VPN è attiva ma persiste l'errore:

1. ✅ **Verifica connessione VPN**: 
   ```bash
   ping gestione-veicolo-fuoriuso-tst.serviziaci.it
   ```

2. ✅ **Verifica risoluzione DNS**:
   ```bash
   nslookup gestione-veicolo-fuoriuso-tst.serviziaci.it
   ```

3. ✅ **Test connessione HTTP**:
   ```bash
   curl -v http://gestione-veicolo-fuoriuso-tst.serviziaci.it/demolitori-aci-ws/rest/concessionario/veicolo
   ```

4. ⚠️ **Se necessario, prova HTTPS** (se richiesto dalla VPN):
   - Cambia `http://` in `https://` nell'URL base

## Note

- La porta `:80` è stata rimossa perché HTTP usa la porta 80 di default
- Se il problema persiste, potrebbe essere necessario usare l'URL pubblico `https://formazione.ilportaledeltrasporto.it` invece dell'URL interno

