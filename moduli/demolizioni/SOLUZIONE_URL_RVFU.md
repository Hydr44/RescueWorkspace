# ✅ Soluzione URL RVFU - ERR_NAME_NOT_RESOLVED

## Problema

Errore `ERR_NAME_NOT_RESOLVED` quando Electron renderer process cerca di chiamare:
```
http://gestione-veicolo-fuoriuso-tst.serviziaci.it/demolitori-aci-ws/rest/...
```

## Causa

Il processo renderer di Electron non può risolvere hostname interni della VPN anche se la VPN è attiva sul sistema. Questo è un problema comune con Electron quando si accede a risorse su VPN.

## Soluzione Applicata

Secondo il manuale `SpecificheWS-GestioneDemolitori1.24.md`:

- **Ambiente Formazione**: `https://formazione.ilportaledeltrasporto.it/`
- **Ambiente Produzione**: `https://www.ilportaledeltrasporto.it/`

Gli endpoint REST sono: `{{baseUrl}}/demolitori-aci-ws/rest/...`

### Modifica

**Prima**:
```typescript
const baseUrl = environment === 'formation' 
  ? 'http://gestione-veicolo-fuoriuso-tst.serviziaci.it'
  : 'http://gestione-veicolo-fuoriuso.serviziaci.it';
```

**Dopo**:
```typescript
const baseUrl = environment === 'formation' 
  ? 'https://formazione.ilportaledeltrasporto.it'
  : 'https://www.ilportaledeltrasporto.it';
```

## Vantaggi

1. ✅ URL pubblico accessibile anche da Electron renderer
2. ✅ Funziona con VPN attiva (il traffico passa comunque attraverso la VPN)
3. ✅ Conforme al manuale ufficiale
4. ✅ HTTPS sicuro per le chiamate API

## Note

- L'autenticazione SSO continua a funzionare perché usa già gli URL pubblici (`https://ssoformazione.ilportaledeltrasporto.it`)
- Le chiamate API REST ora usano lo stesso dominio pubblico
- Con VPN attiva, il traffico viene comunque instradato correttamente

