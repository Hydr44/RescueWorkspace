## Specifiche Web Services – Documento Unico STA Plus (v13.0)

Fonte: `manuali/SpecificheWS-DocumentoUnico-STAPlus-13.0.pdf`.

### 1. Metadati e storia del documento

- **Titolo**: Specifiche Web Services – Documento Unico – STA Plus (Utenti esterni)
- **Versioni principali** (tabella “STORIA DEL DOCUMENTO”):
  - **1.0 – 04/03/2019**: nascita del documento.
  - **2.0 – 15/05/2019**: aggiornamento specifiche per PIN.
  - **3.0 – 22/08/2019**: aggiornamento specifiche.
  - **4.0 – 10/12/2019**: aggiornamento specifiche e controlli per integrazione Pagamenti DT.
  - **5.0 – 17/02/2019**: aggiornamento dati per Duplicati e Ristampe.
  - **6.0 – 16/03/2020**: gestione consecutive e cumulative; aggiunto campo “Motivo Ricusazione” per ricusazioni temporanee.
  - **7.0 – 28/10/2020**: aggiunto tag `TargaEstera` in `DatiTecniciType`.
  - **8.0 – 06/08/2020**: allineamento descrizione RichiestaPresentazionePratica; nuovi servizi:
    - 4.1.12 Richiesta Aggiornamento Importi Pratica
    - 4.1.13 Richiesta Stampa Preview DU
  - **9.0 – 20/12/2021**: aggiunto campo `DescrizioneRidottaRagioneSociale` in `RagioneSocialeType`.
  - **10.0 – 14/07/2022**: aggiornamento WSDL `gestionePraticheDu`:
    - in `DatiTecniciType` aggiunti booleani:
      - `VeicoloAdibitoAtp`
      - `VeicoloClassificatoMezzoDopera`
  - **11.x**: aggiornamento WSDL `gestionePraticheDu`:
    - in `DatiTecniciType` aggiunto booleano:
      - `VeicoloClassificatoAdr`
    - aggiornamento WSDL `utilitaAusiliarieDu`:
      - nuovo servizio 4.2.23 Richiesta Elenco Annotazioni Veicolo
  - **12.0**: aggiornamento WSDL `utilitaAusiliarieDu` (nuovo servizio 4.2.24 Richiesta Lista Annotazioni – testo sintetico nel changelog).
  - **13.0 – 31/10/2023**:
    - nuova operazione **RichiestaAnagraficaEnteCertificatoreVeicoliStoriciRequest** in `utilitaAusiliarieDu`.
    - in `PraticaType > DatiTecniciType` (gestionePraticheDu) aggiunti:
      - `codiceEnteCertificatoreVeicoloStorico`
      - `codiceIscrizioneRegistroVeicoloStorico`
    - usati per le pratiche relative ai “veicoli di interesse storico e collezionistico” (targa storica).

Questi dettagli servono per allineare i nostri modelli (soprattutto `DatiTecniciType` e `PraticaType`) alle ultime evoluzioni normative.

### 2. Indice delle sezioni (alto livello)

Estratto dall’indice del documento:

- **1 INTRODUZIONE**
  - 1.1 Scopo e campo di applicazione  
    → definisce che il documento specifica i servizi WS per il sistema STA Plus del progetto Documento Unico.
  - 1.2 Applicabilità
  - 1.3 Standard
- **2 URL DEI SERVIZI**
  - 2.1 Ambiente di esercizio
  - 2.2 Ambiente di collaudo
- **3 DIAGRAMMI DI PROCESSO**
  - 3.1 Diagramma dei casi d’uso
  - 3.2 Diagramma stati–transizioni
- **4 DEFINIZIONE DEI SERVIZI**
  - 4.1 Gestione pratiche DU (`gestionePraticheDu`)
    - 4.1.1 Richiesta Aggiornamento Pratica
    - 4.1.2 Richiesta Annullamento Pratica
    - 4.1.3 Richiesta Cancellazione Pratica
    - 4.1.4 Richiesta Dettaglio Pratica
    - 4.1.5 Richiesta Errore Pratica
    - 4.1.6 Richiesta Lavorazione Massiva Pratica
    - 4.1.7 Richiesta Presentazione Forzata Pratica
    - 4.1.8 Richiesta Presentazione Pratica
    - 4.1.9 Richiesta Ricerca Pratica
    - 4.1.10 Richiesta Stampa Pratica
    - 4.1.11 Richiesta Validazione Pratica
    - 4.1.12 Richiesta Aggiornamento Importi Pratica
    - 4.1.13 Richiesta Stampa Preview DU
  - 4.2 Utilità ausiliarie DU (`utilitaAusiliarieDu`)
    - 4.2.1 Richiesta Anagrafica Alimentazione
    - 4.2.2 Richiesta Anagrafica Applicazione
    - 4.2.3 Richiesta Anagrafica Categoria Veicolo
    - 4.2.4 Richiesta Anagrafica Causale Credito
    - 4.2.5 Richiesta Anagrafica Causale Perdita Possesso
    - 4.2.6 Richiesta Anagrafica Comune
    - 4.2.7 Richiesta Anagrafica Destinazione Uso Carrozzeria
    - 4.2.8 Richiesta Anagrafica Forma Atto
    - 4.2.9 Richiesta Anagrafica Nazione
    - 4.2.10 Richiesta Anagrafica Provincia
    - 4.2.11 Richiesta Anagrafica Ragione Sociale
    - 4.2.12 Richiesta Anagrafica Sigla Corpo Speciale
    - 4.2.13 Richiesta Anagrafica Tipo Atto
    - 4.2.14 Richiesta Anagrafica Tipo Esenzione
    - 4.2.15 Richiesta Anagrafica Tipo Pratica Applicazione
    - 4.2.16 Richiesta Anagrafica Tipo Pratica
    - 4.2.17 Richiesta Anagrafica Tipo Provvedimento
    - 4.2.18 Richiesta Anagrafica Tipo Richiesta
    - 4.2.19 Richiesta Anagrafica Tipo Ruolo Soggetto
    - 4.2.20 Richiesta Anagrafica Tipo Titolo Allegato Atto
    - 4.2.21 Richiesta Anagrafica Tipo Veicolo
    - 4.2.22 Richiesta Anagrafica Toponimo
    - 4.2.23 Richiesta Elenco Annotazioni Veicolo
    - 4.2.24 Richiesta Lista Annotazioni
    - 4.2.25 Richiesta Anagrafica Ente Certificatore Veicoli Storici
  - 4.3 WSDL/XSD
- **5 MODALITÀ DI AUTENTICAZIONE DI UN UTENTE PER L’UTILIZZO DEI WEB SERVICE**
  - 5.1 Specifiche dello schema XSD di input
- **6 CHANGE LOG**
  - 6.1 … 6.13 versioni (vedi sopra).

Questa sezione ci serve come “indice operativo”: per il modulo demolizioni/RVFU useremo solo un sottoinsieme mirato di questi servizi (soprattutto ricerca/validazione/stampa pratiche e anagrafiche veicoli).

### 3. Autenticazione e sicurezza (WS-Security)

Sezione 5: “Modalità di autenticazione di un utente per l’utilizzo dei Web Service”.

- **Schema generale richiesta**:
  - Envelope SOAP con:
    - **Header**:
      - contiene le informazioni per autenticazione/autorizzazione.
      - include blocco `wsse:Security` con `wsse:UsernameToken`.
    - **Body**:
      - contiene la richiesta applicativa (tipo specifico per il servizio invocato).

- **UsernameToken con PasswordDigest** (estratto dall’esempio):

  ```xml
  <sll:envelope xmlns:sll="..." xmlns:wsse="..." xmlns:wsu="...">
    <sll:header>
      ...
      <wsse:security>
        <wsse:usernametoken>
          <wsse:username>NNK</wsse:username>
          <wsse:password type="...#PasswordDigest">
            weYI3nXd8LjMNVksCKFV8t3rgHh3Rw==
          </wsse:password>
          <wsse:nonce>WScqanjCEAC4mQoBE07sAQ==</wsse:nonce>
          <wsu:created>2003-07-16T01:24:32Z</wsu:created>
        </wsse:usernametoken>
      </wsse:security>
      ...
    </sll:header>
    ...
  </sll:envelope>
  ```

- **Algoritmo PasswordDigest** (descritto in specifica, riassunto):
  - `PasswordDigest = Base64( SHA-1( nonce + created + password ) )`
  - dove:
    - `nonce`: valore random/una tantum (base64),
    - `created`: timestamp ISO8601,
    - `password`: password in chiaro (condivisa con STA Plus).

Per la nostra implementazione:

- lato backend dovremo:
  - generare `nonce` random sicuro,
  - calcolare `created` (UTC),
  - concatenare `nonce + created + password`,
  - calcolare SHA-1 e codificarlo in Base64,
  - costruire il blocco `wsse:UsernameToken` come da esempio.
- sarà necessario un modulo di utilità analogo a quanto fatto per RENTRI, ma con algoritmo SHA‑1/PasswordDigest invece di JWT.

### 4. Impatto sul design del modulo

Punti da tenere presenti per il design del modulo demolizioni/RVFU:

- Quando in futuro integreremo **Documento Unico / STA Plus**:
  - dobbiamo prevedere:
    - gestione credenziali (username/password DU) per ogni organizzazione/agenzia,
    - generazione dinamica dell’header WS-Security,
    - mapping tra le nostre **pratiche demolizione/RVFU** e le **pratiche DU** (tipi pratica, DatiTecniciType, veicoli storici, ecc.).
- Per ora questo file è la base “ministeriale” di riferimento:
  - quando useremo un servizio specifico (es. RichiestaPresentazionePratica), andremo ad aggiungere in questo `.md` il dettaglio di request/response e vincoli esatti.





