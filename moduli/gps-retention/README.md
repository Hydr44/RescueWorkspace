# gps-retention — conservazione delle posizioni GPS

Cancella dalla tabella `transport_tracking` i punti GPS più vecchi del termine
di conservazione. Nient'altro: non tocca trasporti, autisti, foto o documenti.

## Perché

`transport_tracking` accumulava dal 28 maggio 2026 senza nessun termine di
conservazione e senza nessun lavoro di pulizia. Sono dati di **localizzazione di
lavoratori dipendenti**: il problema non è lo spazio occupato, è che vanno
cancellati dopo un termine definito e dichiarato nell'informativa.

## Il numero di giorni è una tua decisione

`GPS_RETENTION_DAYS` in `/root/.env`. Il valore predefinito è **90**.

Non è un default tecnico: deve coincidere con quello che hai scritto
nell'informativa privacy, e va concordato con chi ti segue sul GDPR. Più il
termine è lungo, più serve una ragione per giustificarlo.

Fotografia al 3 settembre 2026 (333 punti, 4 autisti, dal 28/05 al 06/07):

| Termine | Cancellerebbe oggi |
|--------|--------------------|
| 180 giorni | 0 punti |
| 90 giorni | 1 punto |
| 30 giorni | tutti e 333 |
| 7 giorni | tutti e 333 |

## Che cosa smette di funzionare: niente

Verificato leggendo tutti e tre i punti del codice che usano questa tabella.

- **Mappa live del desktop** (`TransportTracking.jsx`) — usa solo l'**ultimo**
  punto per trasporto, come marcatore "dov'è adesso". La linea del percorso
  disegnata sulla mappa **non viene dai punti GPS**: è la rotta calcolata da
  OSRM fra ritiro e consegna. Cancellare i punti vecchi non toglie nessuna linea.
- **Pagina pubblica `/track`** che vede il cliente — serve durante l'intervento,
  che dura minuti. Un punto vecchio di 90 giorni appartiene a un lavoro chiuso
  da mesi. La pagina degrada da sola quando non c'è una posizione (`hasVehicle`).
- **Diagnostica GPS** in Impostazioni — cerca solo i punti registrati **da quando
  parte la verifica**, cioè secondi prima.

Nessuna chiave esterna, nessuna vista e nessuna funzione del database dipende da
`transport_tracking`. Dei 333 punti attuali, **330 appartengono a trasporti già
chiusi**.

**Quello che si perde davvero:** la possibilità di ricostruire a posteriori dove
si trovava un mezzo in un certo giorno. Se una compagnia contesta un intervento
a distanza di mesi, quel dato non c'è più. È il senso stesso di un termine di
conservazione, ma è giusto saperlo prima.

## Installazione sul VPS

```bash
# 1. termine di conservazione in /root/.env
echo 'GPS_RETENTION_DAYS=90' >> /root/.env

# 2. modulo
mkdir -p /opt/gps-retention && cd /opt/gps-retention
# (copia qui i file di questa cartella)
npm install --production

# 3. PRIMA prova a vuoto: conta e basta, non cancella niente
npm run dry

# 4. quando il numero ti convince
pm2 start ecosystem.config.js && pm2 save
```

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dry` | Conta quanti punti supererebbero il termine. **Non cancella.** |
| `npm run check` | Esegue una volta davvero, poi esce. |
| `npm start` | Resta attivo e gira ogni notte alle 03:30 (dopo il backup delle 03:00). |

Variabili: `GPS_RETENTION_DAYS` (giorni), `GPS_RETENTION_CRON` (pianificazione,
predefinita `30 3 * * *`), `DRY_RUN`, `RUN_ONCE`.

## Note

- Cancella a blocchi di 1000 per non tenere lock lunghi su tabelle grandi.
- Un errore viene scritto a log e il servizio resta su: il giro successivo è
  comunque fra 24 ore, non ha senso far rimbalzare il processo.
- `@supabase/supabase-js` è fissato a `2.99.1` come gli altri moduli: le
  versioni successive richiedono Node più recente di quello del VPS.
