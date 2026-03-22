# 🔍 Debug: BrowserWindow Visibile Abilitato

## Modifiche Applicate

Ho abilitato il BrowserWindow **visibile** per debug:

1. **`DemolizioneRVFUForm.jsx`**: Abilitato `useBrowserWindow: true` per la ricerca veicoli
2. **`DemolizioniRVFU.jsx`**: Abilitato `useBrowserWindow: true` per il caricamento casi
3. **`electron/ipc.js`**: Impostato `show: true` e DevTools automatici

## Cosa Vedrai

Quando fai una ricerca veicolo o carichi i casi, vedrai:
- ✅ Una finestra BrowserWindow che si apre
- ✅ DevTools aperti automaticamente
- ✅ La pagina `rvfu-api-proxy.html` caricata
- ✅ I log nella console di DevTools
- ✅ La chiamata API in esecuzione
- ✅ La risposta del server

## Cosa Osservare

1. **Cookie di sessione**: Controlla in DevTools → Network → Request Headers se ci sono cookie `iPlanetDirectoryPro` o altri cookie SSO
2. **Risposta HTML**: Se vedi ancora "Submit This Form", controlla nella console del BrowserWindow cosa viene restituito
3. **Redirect**: Verifica se ci sono redirect verso `/agent/cdsso-oauth2`
4. **Errori**: Controlla se ci sono errori nella console del BrowserWindow

## Come Disabilitare

Per tornare alla modalità normale (finestra invisibile):
- In `electron/ipc.js`: cambia `show: true` in `show: false`
- Nei file `.jsx`: cambia `createRVFUClient(authService, 'formation', true)` in `createRVFUClient(authService, 'formation', false)` o rimuovi il terzo parametro

## Note

- La finestra si chiude automaticamente dopo la risposta (o timeout)
- Se vedi ancora l'errore CDSSO, potrebbe significare che:
  - I cookie di sessione non vengono inviati correttamente
  - Serve una configurazione aggiuntiva del server
  - Il problema è lato server (configurazione client OAuth)

