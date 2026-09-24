# Email RescueManager, tema nuovo

`email-template.js` sostituisce le quattro copie del template che ci sono oggi: `website/src/lib/email-template.ts`, `moduli/messaging/email-template.js`, `moduli/lead-api/lib/email.js`, e i sei template Supabase in `desktop-app/.../supabase/email-templates/` (che vanno rigenerati con la stessa funzione). La funzione Supabase `send-email` ha ancora uno stile più vecchio (#333, #666): va sostituita con questo.

## Cosa cambia

| Oggi | Nuovo |
| --- | --- |
| Testata navy #0f172a con il logo e un sottotitolo in maiuscolo spaziato | Testata nel blu della barra laterale (#0B3FB5) con il logo bianco; piè di pagina nel tono di testa e piede (#062A7A). Se l'email la manda un cliente di RescueManager (fattura, avviso), il suo nome sta a destra |
| Blu #2563eb (non è il blu del marchio) | Un solo blu, #005DFA |
| Pulsante in maiuscolo spaziato | Pulsante pieno, squadrato, testo normale ("Scegli la password"), con sotto l'indirizzo per chi non può cliccare |
| Nessun titolo: si parte da "Ciao Mario," | Titolo che dice cosa è successo ("Fattura 2026/0142", "Il certificato RENTRI scade tra 15 giorni") e una riga sotto con a chi o quando |
| Righe info in grassetto dentro un riquadro | Righe etichetta e valore come nelle schede dell'app, una informazione per riga; il totale in grande a parte |
| Piè di pagina navy con slogan, "&mdash;" e "&middot;" | Piè di pagina blu scuro: chi manda, perché la ricevi, a chi scrivere, una riga per informazione. Niente slogan, niente separatori |
| Font di sistema | Inter dove c'è, poi il font di sistema (nelle email non si può caricare un font, va bene così) |

Il corpo resta chiaro: le email si leggono su Gmail e Outlook e il dark mode delle email è inaffidabile; testa e piede portano i blu dell'app (`color-scheme: light` nel `<head>` chiede ai client di non invertire i colori).

## Il logo

Nelle email si usa `logo-principale-bianco.svg` sulla testata blu. Il file `logo-principale-a-colori.svg` ha "RESCUE" in bianco: su fondo chiaro sparisce. Per il sito su fondo chiaro serve `logo-principale-a-colori-su-chiaro.svg` (qui accanto: stesso file con il bianco sostituito da #161616). Va caricato in `website/public/assets/logos/` e aggiunto al design system.

## Uso

```js
import { brandedHtml } from './email-template.js';

const html = brandedHtml('In allegato la fattura in PDF.', {
  sender: 'Autosoccorso Bianchi S.r.l.',          // chi manda, se non è RescueManager stessa
  title: 'Fattura 2026/0142',
  sub: 'Autofficina Vella S.r.l., 23 settembre 2026',
  amount: { label: 'Totale da pagare entro il 23 ottobre', value: '181,78 euro' },
  rows: [['Per', 'Soccorso stradale del 23 settembre'], ['Pagamento', 'Bonifico a 30 giorni']],
  cta: { href: 'https://rescuemanager.eu/pratica/TR0000', label: 'Apri la fattura' },
  note: 'Testo piccolo sotto il pulsante',
  reason: 'Ricevi questa email perché sei cliente di Autosoccorso Bianchi.',
});
```

Altre opzioni: `code` e `codeNote` per i codici di accesso, `notice: { text, level: 'info' | 'danger' }` per gli avvisi, `preheader` per l'anteprima nella casella. Un pulsante solo per email.

## Esempi

In `esempi/` ci sono sei email nella versione di oggi e in quella nuova: attivazione account, codice di accesso, fattura, preventivo, scadenza certificato RENTRI, demo confermata. Gli oggetti vanno riscritti con le stesse regole: niente punti esclamativi, niente "—", il fatto prima del nome ("Fattura 2026/0142 da Autosoccorso Bianchi", non "RescueManager - Fattura").
