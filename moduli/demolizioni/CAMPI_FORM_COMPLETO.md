# Campi Form Completo per Demolizione RVFU

## Campi Attuali nel Form
- targa
- marca
- modello
- anno
- colore
- numero_telaio
- proprietario_nome (solo nome completo)
- proprietario_cf
- proprietario_indirizzo
- proprietario_cap
- proprietario_comune
- proprietario_provincia
- proprietario_telefono
- proprietario_email
- demolizione_data
- demolizione_causale
- demolizione_km
- demolizione_osservazioni

## Campi Mancanti da Aggiungere

### Veicolo
- [ ] tipoVeicolo (A, M, C, R, T, Q, S, U, V, W, X, Y, Z) *REQUIRED*
- [ ] cilindrata (number, opzionale)
- [ ] potenza (number, opzionale)
- [ ] dataPrimaImmatricolazione (date, opzionale)
- [ ] flagConsegnaForzeOrdine (S/N) *REQUIRED*
- [ ] canaleNoPra (boolean, opzionale)
- [ ] cic (string, opzionale)

### Intestatario - Dati Personali
- [ ] nome (separato da cognome) *REQUIRED se PF*
- [ ] cognome (separato da nome) *REQUIRED se PF*
- [ ] tipoPersonaGiuridica (PF/PG) *REQUIRED*
- [ ] ragioneSociale (se PG) *REQUIRED se PG*
- [ ] dataNascita (date, opzionale)

### Intestatario - Luogo di Nascita
- [ ] codiceComuneNascita (codice ISTAT 3 cifre, opzionale)
- [ ] comuneNascita (denominazione, opzionale)
- [ ] codiceProvinciaNascita (codice ISTAT 3 cifre, opzionale)
- [ ] provinciaNascita (sigla 2 lettere, opzionale)
- [ ] statoNascita (se estero, opzionale)
- [ ] codiceStatoEsteroNascita (codice ISTAT 3 cifre, opzionale)
- [ ] localitaEsteraNascita (se estero, opzionale)

### Intestatario - Residenza
- [ ] codiceComuneResidenza (codice ISTAT 3 cifre) *REQUIRED*
- [ ] comuneResidenza (denominazione) *REQUIRED*
- [ ] codiceProvinciaResidenza (codice ISTAT 3 cifre) *REQUIRED*
- [ ] provinciaResidenza (sigla 2 lettere) *REQUIRED*
- [ ] indirizzoResidenza (string) *REQUIRED*
- [ ] numeroCivicoResidenza (string, opzionale)
- [ ] capResidenza (string) *REQUIRED*
- [ ] dugResidenza (Denominazione Urban Generica, opzionale)
- [ ] toponimoResidenza (opzionale)
- [ ] statoResidenza (se estero, opzionale)
- [ ] codiceStatoEsteroResidenza (codice ISTAT 3 cifre, opzionale)
- [ ] localitaEsteraResidenza (se estero, opzionale)

### Detentore (Opzionale - sezione completa)
- [ ] Mostra detentore (toggle)
- Tutti i campi dell'intestatario ripetuti per il detentore

### Distinta Documenti *TUTTI REQUIRED*
- [ ] du (ASSENTE/DENUNCIA/DOCUMENTO/VERBALE) *REQUIRED*
- [ ] cdc (ASSENTE/DENUNCIA/DOCUMENTO/VERBALE) *REQUIRED*
- [ ] cdp (ASSENTE/DENUNCIA/DOCUMENTO) *REQUIRED*
- [ ] foglioC (ASSENTE/DENUNCIA/DOCUMENTO) *REQUIRED*
- [ ] documentoIntestatario (boolean) *REQUIRED*
- [ ] documentoDetentore (boolean) *REQUIRED*
- [ ] targaAnteriore (boolean) *REQUIRED*
- [ ] targaPosteriore (boolean) *REQUIRED*
- [ ] targaDenuncia (boolean) *REQUIRED*
- [ ] altro (string, opzionale)

### Note
- [ ] noteAggiuntive (string, opzionale)
- [ ] notePartiRifiuti (string, opzionale)

