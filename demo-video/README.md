# RescueManager — Video demo (Remotion)

Video demo commerciale generato via codice con [Remotion](https://remotion.dev).
Ricrea **fedelmente** l'interfaccia reale dell'app (desktop dark navy + mobile blu-notte)
e racconta due flussi in un unico filmato cinematografico con zoom, transizioni e
didascalie in italiano. Nessuna registrazione schermo: tutto è renderizzato, quindi
è modificabile e ri-generabile all'infinito.

## Cosa produce — DUE video, ciascuno "dalla presa in carico alla fattura"

| Video | ID composizione | Contenuto | Durata |
|---|---|---|---|
| Soccorso stradale | `Soccorso` | Intro → soccorso desktop+mobile → **fattura** → Outro | ~41 s |
| Demolizione VFU | `Demolizione` | Intro → accettazione → lavorazione → RENTRI → **fattura** → Outro | ~24 s |
| Completo (walkthrough) | `Completo` | Intro → Dashboard → Soccorso completo → Demolizione completa → Riepilogo moduli → Outro | ~5 min |

Il video `Completo` è il walkthrough esteso: include anche Dashboard, tutti gli step del wizard VFU (Cerca → Dati → Documenti → Conferma), la schermata Condizioni prima della firma, il Certificato di rottamazione e un riepilogo moduli finale, con didascalie che ruotano e camera continua.

Output: **MP4 1920×1080 @ 30fps**, alta qualità (CRF 18), pronto per YouTube / LinkedIn / sito.
UI ricreata **squadrata** (angoli vivi, 0px raggi) e con il **logo ufficiale** come nell'app reale.

## Storyboard

**Video 1 — Soccorso stradale** (desktop → telefono → fattura)
1. Lista *Soccorso & trasporti* → nuovo intervento
2. Form nuovo soccorso: tipologia, cliente, percorso, assegnazione autista
3. *Tracking Live* GPS della flotta
4. 📱 Notifica push all'autista + Home "Oggi"
5. 📱 Dettaglio trasporto
6. 📱 Navigazione turn-by-turn
7. 📱 Foto dei danni al ritiro
8. 📱 Firma digitale del cliente
9. **Fattura elettronica** (righe da trasporto, invio SdI)

**Video 2 — Demolizione veicoli (VFU)** (accettazione → fattura)
1. Nuova pratica VFU: ricerca veicolo nel Registro ACI/MIT
2. Timeline lavorazione (accettazione, messa in sicurezza, bonifica…)
3. Rifiuti RENTRI: carico/scarico e trasmissione (accenno rapido)
4. **Fattura elettronica** al cliente (voci servizio VFU: demolizione, radiazione PRA, ritiro, CdR)

## Comandi

```bash
cd demo-video
npm install            # solo la prima volta

npm run dev            # apre Remotion Studio (anteprima interattiva nel browser)

npm run render:soccorso    # -> out/soccorso.mp4
npm run render:demolizione # -> out/demolizione.mp4
npm run render:completo    # -> out/rescuemanager-completo.mp4 (~5 min)
npm run render:all         # tutti e tre
```

## Come personalizzare

- **Testi / didascalie**: `src/scenes/beats.tsx` (prop `caption` e `side`).
- **Dati mostrati** (cliente, targhe, autista, prezzi, CER…): `src/lib/data.ts`.
- **Colori / brand**: `src/lib/theme.ts` (già allineati ai valori reali dell'app).
- **Durate e ordine scene**: `DUR` in `src/scenes/beats.tsx`, montaggio in `src/Video.tsx`.
- **Camera (zoom/pan)**: prop `camera` nelle scene (`beats.tsx`).

## Musica / voce (opzionale)

Il video esce **senza audio** (didascalie a schermo). Per pubblicarlo con musica o
voce narrante: importa l'MP4 nel tuo editor (CapCut, Premiere, DaVinci) e aggiungi la
traccia. In alternativa, si può aggiungere una traccia audio direttamente in Remotion
con `<Audio src={staticFile("musica.mp3")} />` in `src/Video.tsx` (mettere il file in
`public/`).

## Struttura

```
src/
  Root.tsx              registrazione composizioni
  Video.tsx             montaggio (TransitionSeries) delle 3 composizioni
  lib/                  theme, fonts, dati, helper animazioni
  components/
    ui/                 Stage, Cursor, Caption, Pill, Icon, Logo
    desktop/            finestra macOS + Sidebar/Topbar/StatusBar + kit
    mobile/             cornice telefono + TabBar
  screens/
    desktop/            schermate desktop (soccorso + demolizione)
    mobile/             schermate app autista
  scenes/               intro, outro, wrapper scena (Desktop/Phone), beats
```
