# Roadmap RENTRI Demo → Produzione

## Fase 0 – Setup (completata)
- Scarico documentazione ufficiale demo (`demo-docs`).
- Import certificato dominio (`cert/SCZMNL05L21D960T.p12`).
- Creazione cartella piani (architettura, roadmap, implementazioni).

## Fase 1 – Proof of Concept (T+1 settimana)
1. Client REST generico con mTLS (cURL/Node) puntato alle API `anagrafiche` e `codifiche`.
2. Logging Supabase dedicato (`rentri_events`).
3. Mock UI per test STUB (gestione `422` e polling `status`).

## Fase 2 – Integrazione registri & FIR (T+3 settimane)
- Implementare adapter `dati-registri` (upload batch, verifica esito).
- Implementare adapter `formulari` / `vidimazione-formulari`.
- Gestione firma remota (servizio `ca-rentri` per device/token).

## Fase 3 – Hardening & deploy (T+5 settimane)
- Monitoraggio errori e alerting (Supabase Functions + Slack).
- Documentare runbook (rollback, rotazione certificati, rinnovo device).
- Preparare switch a produzione (nuovi certificati, endpoint `prod`).

## Milestones
- **M1**: POC completato e testato (modalità STUB).  
- **M2**: Registri e FIR funzionanti end-to-end.  
- **M3**: Cutover ambiente produzione.

Aggiornato al $(date +%Y-%m-%d).
