# Login Desktop App — Note di Design

## Stato attuale

La pagina login è stata ripulita dagli elementi "AI-style" (particelle, blob blur, gradienti indigo-to-purple, hover:scale, glassmorphism) e allineata al Design L navy. Tuttavia il risultato è **troppo piatto e vuoto**: un unico colore di fondo, layout troppo grande, poco carattere visivo.

## Problemi principali

### 1. Brand side (colonna sinistra)
- **Troppo vuoto**: logo + testo + 4 bullet point su sfondo piatto `#0c1929`
- **Nessun elemento visivo** che rompa la monotonia — serve qualcosa che dia identità senza tornare ai blob/particelle
- **Logo troppo grande** (h-40) e isolato, non integrato nel layout
- **Testo generico**: "Il gestionale per autodemolizioni e soccorso stradale" è corretto ma poco coinvolgente

### 2. Form side (colonna destra)
- **Card troppo grande** e centrata nel vuoto — molto spazio inutile attorno
- **Unico bottone "Accedi con il browser"** senza contesto — l'utente non capisce perché si apre il browser
- **Nessuna illustrazione o icona** che accompagni il flusso
- **Manca feedback visivo** su cosa succede dopo il click (il progress bar c'è ma appare solo dopo)

### 3. Sub-componenti (OperatorSelection, OperatorLogin, CreateFirstOperator)
- Sono **card innestate dentro la card** del form — doppio bordo, doppio padding
- **Manca transizione** tra i vari stati (OAuth → selezione operatore → login operatore)
- L'avatar operatore è un cerchio `bg-blue-600` con iniziale — funzionale ma anonimo

### 4. Layout generale
- **Grid 2 colonne** su desktop è OK ma le due metà sono sbilanciate
- Su **mobile** la colonna brand è nascosta (`hidden md:flex`) — l'utente vede solo il form senza contesto
- **Nessun footer** con info versione/copyright

---

## Proposte di miglioramento

### Opzione A: Evoluzione del layout attuale
Mantenere la struttura 2 colonne ma arricchirla:

- **Brand side**: aggiungere un pattern geometrico sottile (linee diagonali o griglia a punti con opacità 5%) come texture di sfondo. Inserire uno screenshot/mockup dell'app sotto il testo per dare un'anteprima visiva.
- **Form side**: ridurre la larghezza della card (`max-w-sm` invece di `max-w-md`), aggiungere il logo anche qui su mobile, migliorare il copy del bottone ("Accedi tramite browser sicuro" + icona lucchetto).
- **Transizioni**: aggiungere una transizione CSS (`opacity + translateY`) quando si passa da OAuth a selezione operatore.

### Opzione B: Layout centrato singola colonna
Rifare completamente con un layout centrato:

- **Sfondo**: `#141c27` con un sottile gradiente radiale al centro (es. `radial-gradient(circle at 50% 30%, #1a2536 0%, #141c27 70%)`) per dare profondità senza essere invadente.
- **Card unica centrata** con logo in alto, titolo, sottotitolo, e il form/bottone.
- **Sotto la card**: le 4 feature in una riga orizzontale con icone piccole.
- **Vantaggio**: funziona uguale su desktop e mobile, meno spazio vuoto.

### Opzione C: Layout a pannello con sidebar branding
Ispirato a login di app SaaS moderne (Linear, Vercel, Supabase):

- **Sidebar stretta a sinistra** (~280px) con logo, nome app, e una frase. Sfondo leggermente diverso (`#0c1929`).
- **Area principale** con il form centrato verticalmente.
- **Barra in basso** con versione app e link a supporto.
- Su mobile la sidebar diventa un header compatto.

---

## Dettagli tecnici da considerare

- **Electron**: la finestra di login potrebbe avere dimensioni fisse (es. 900x600) invece di `min-h-screen`
- **Titlebar**: se c'è una titlebar custom, il layout deve tenerne conto
- **Tema**: restare nel Design L navy (`#0c1929`, `#141c27`, `#1a2536`, `#243044`, `blue-500/600`)
- **Font**: Inter, pesi 300-700, `font-medium` per contenuti, `font-semibold` per titoli
- **No animazioni eccessive**: transizioni CSS semplici (opacity, transform), niente framer-motion o keyframes complessi
- **Accessibilità**: focus ring visibili, contrasto testo sufficiente, label associate agli input

---

## Priorità suggerita

1. Scegliere tra Opzione A/B/C
2. Implementare il layout base
3. Migliorare il copy e le micro-interazioni
4. Testare su diverse risoluzioni (la finestra Electron potrebbe essere piccola)
