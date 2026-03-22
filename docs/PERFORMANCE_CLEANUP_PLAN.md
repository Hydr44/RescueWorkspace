cd ## Piano Performance & Pulizia – Desktop App

Obiettivo: migliorare reattività UI, ridurre carico rete/CPU, semplificare codice senza cambiare funzionalità.

### Ambito iniziale
- Focus pagina `Trasporti` (liste, filtri, export PDF)
- Ottimizzazioni trasversali: logging, import, bundle, immagini

### KPI (baseline → target)
- TTFI pagina Trasporti: ≤ 2.5s su dataset medio
- Re-render per interazione filtro: -50%
- Payload per pagina: solo colonne usate (no `select *`)
- Tempo export PDF (1000 righe): -30%

### Fase 1 – Quick wins (senza breaking change)
- Query selettive (solo colonne visualizzate)
- Debounce ricerca (300–400ms)
- Paginazione server-side coerente (25/50/100 righe)
- `useMemo`/`useCallback` su selettori/props di lista
- Riduzione log verbosi in produzione

Checklist Fase 1
- [x] Trasporti: selettività query Supabase
- [x] Trasporti: debounce ricerca testo/filtri
- [x] Trasporti: paginazione server-side
- [x] Trasporti: memoizzazione selettori/renderer
- [ ] Logging: livello unificato e ridotto

### Fase 2 – Liste grandi e bundle
- Virtualizzazione (react-window) > 500 righe
- Analisi bundle (vite-bundle-visualizer) e tree-shaking icone
- Lazy load pagine pesanti (se non già attivo)

Checklist Fase 2
- [ ] Report bundle e rimozione dipendenze pesanti
- [ ] Verifica lazy routes e prefetch principali
- [ ] (Opzionale) Abilitare virtualizzazione tabelle grandi se si alza il page-size > 200

### Fase 3 – Pulizia codice
- Rimuovere import non usati/duplicati
- Centralizzare costanti (stati, badge, colori) in modulo condiviso
- Estrarre hook riusabili: `usePaginatedList`, `useSupabaseRealtime`

Checklist Fase 3
- [ ] Pulizia import e alias coerenti
- [ ] Modulo costanti dominio (stati trasporto, badge)
- [ ] Hook comuni estratti e documentati

### Fase 4 – QA & Profiling
- Profiling React DevTools su flussi critici
- Test con rete lenta/instabile (UX spinner/fallback)
- Export PDF con dataset grande (tempo/dimensione)

Checklist Fase 4
- [ ] Profiling re-render Trasporti (prima/dopo)
- [ ] Test rete lenta e fallback UI chiari
- [ ] Benchmark export PDF 1k righe

### Linee guida implementative
- Evitare `setState` multipli in rapida sequenza → functional set
- Validare input filtri prima della query
- Invalidazione cache semplice (in-memory) su mutazioni rilevanti
- Preferire `for..of` a `.forEach` nei loop critici
- Evitare font non supportati in jsPDF; fallback `helvetica`

### Note operative
- Le modifiche saranno committate per step piccoli e verificabili
- Questo file verrà aggiornato spuntando i task e aggiungendo note di impatto

### Log aggiornamenti
- [x] Inizializzazione piano (questo documento)
- [x] Implementata ottimizzazione Trasporti: select mirata, debounce 350ms, paginazione server-side, memo row


