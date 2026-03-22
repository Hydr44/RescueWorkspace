# DOCUMENTO TECNICO SDI-SFTP — RescueManager

**Data:** 13 Febbraio 2026
**Versione:** 1.0
**Riferimento accordo:** Accordo di Servizio SDI del 13.02.2026

---

## 1. DATI ACCREDITAMENTO

### 1.1 Sottoscrittore
| Campo | Valore |
|-------|--------|
| **Sottoscrittore** | SCOZZARINI, EMMANUEL SALVATORE |
| **P.IVA** | 02166430856 |
| **PEC** | rescuemanager@legalmail.it |
| **Telefono** | 3921723028 |

### 1.2 Riferimento Tecnico
| Campo | Valore |
|-------|--------|
| **Nome** | SCOZZARINI, Emmanuel Salvatore |
| **Codice Fiscale** | SCZMNL05L21D960T |
| **Email** | info@rescuemanager.eu |
| **Telefono** | 3921723028 |

### 1.3 Configurazione Nodo SFTP
| Campo | Valore |
|-------|--------|
| **Id Nodo** | 02166430856 |
| **Indirizzo IP** | ftp://217.154.118.37 |
| **Versione protocollo** | 2.0 |
| **Servizio** | SDIFTP - Invio e Ricezione FatturaPA tramite SFTP |

### 1.4 Certificati
| Certificato | Path VPS | Scopo |
|-------------|----------|-------|
| **Firma** | `/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.firma.p12` | Firma CAdES-BES dei file XML |
| **Cifratura** | `/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12` | Decifratura file ricevuti da SdI |
| **Sogei pubblica** | `/opt/sdi-certs/sogeiunicocifra.pem` | Cifratura file verso SdI |

### 1.5 Requisiti Crittografici (obbligatori dal 01/01/2023)
| Parametro | Requisito minimo |
|-----------|-----------------|
| **Algoritmo hash** | SHA-256 |
| **Chiavi RSA cifratura** | 4096 bit |
| **Chiavi RSA firma** | 4096 o 2048 bit |
| **Algoritmo cifratura** | AES-256 |

---

## 2. ARCHITETTURA DEL SISTEMA

### 2.1 Componenti
```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Desktop App        │────▶│  VPS Server      │────▶│  SDI (Sogei)    │
│  (Electron)         │     │  217.154.118.37   │     │  Client SFTP    │
│                     │     │                   │     │                 │
│  - InvoiceNew.jsx   │     │  - server.js:3004 │     │  Preleva da:    │
│  - sdi.js           │     │  - xml-generator  │     │  DatiVersoSdI/  │
│  - sdi.ts (driver)  │     │  - SFTP server    │     │                 │
│                     │     │  - PM2 managed    │     │  Deposita in:   │
│                     │     │                   │     │  DatiDaSdI/     │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
```

### 2.2 Flusso di Comunicazione
Il colloquio avviene **sempre su iniziativa del client SdI** (Sogei):
- **SdI è il client SFTP** → si connette al nostro server SFTP
- **Noi siamo il server SFTP** → esponiamo le directory di scambio
- SdI effettua azioni di **GET** (preleva i nostri file) e **PUT** (deposita file per noi)

> **IMPORTANTE:** Non siamo noi a connetterci a Sogei. È Sogei che si connette a noi.

### 2.3 Directory di Scambio
| Directory | Direzione | Uso |
|-----------|-----------|-----|
| `/var/sftp/sdi/DatiVersoSdI/` | Nodo → SdI | File fatture da inviare (produzione) |
| `/var/sftp/sdi/DatiDaSdI/` | SdI → Nodo | Notifiche/esiti ricevuti (produzione) |
| `/var/sftp/sdi/DatiVersoSdITest/` | Nodo → SdI | File fatture di test |
| `/var/sftp/sdi/DatiDaSdITest/` | SdI → Nodo | Notifiche/esiti di test |

### 2.4 Server VPS
| Parametro | Valore |
|-----------|--------|
| **IP** | 217.154.118.37 |
| **PM2 name** | sdi-sftp-server |
| **Porta API** | 3004 |
| **Porta SFTP** | 22 |
| **Codice** | `/opt/sdi-sftp-server/server.js` |
| **XML Generator** | `/opt/sdi-sftp-server/xml-generator.js` |
| **Modalità** | Test (`SDI_SFTP_TEST_MODE=true`) |

---

## 3. STRUTTURA DEI SUPPORTI (FILE)

### 3.1 Tipi di Supporto
| Tipo | Direzione | Descrizione |
|------|-----------|-------------|
| **FI** | Nodo → SdI | File In ingresso (fatture da noi verso SdI) |
| **FO** | SdI → Nodo | File in Uscita (notifiche/esiti da SdI verso noi) |
| **EO** | SdI → Nodo | Esito Operativo (conferma ricezione supporto FI) |
| **ER** | SdI → Nodo | Esito Rifiuto (scarto per errori firma/decifratura) |

### 3.2 Nomenclatura Supporti

#### Supporto FI (File In — noi verso SdI)
```
FI.{IdNodo}.{progressivo}.zip
```
- **IdNodo**: `02166430856` (P.IVA del sottoscrittore)
- **Progressivo**: numerico, da 0 a 899 (produzione) o 900-999 (test)
- **Esempio**: `FI.02166430856.900.zip`

#### Supporto FO (File Out — SdI verso noi)
```
FO.{IdNodo}.{progressivo}.zip
```

#### Esito EO
```
EO.{IdNodo}.{progressivo}.zip
```

### 3.3 Composizione Supporto FI (ZIP)
Un supporto FI contiene:
1. **File di quadratura** (XML) — obbligatorio, 1 per supporto
2. **File fattura firmati** (.xml.p7m) — da 1 a 1000 per supporto

```
FI.02166430856.900.zip
├── FI.02166430856.900.xml          ← File di quadratura
├── IT02166430856_00001.xml.p7m     ← Fattura 1 (firmata CAdES-BES)
├── IT02166430856_00002.xml.p7m     ← Fattura 2 (firmata CAdES-BES)
└── ...
```

#### File di Quadratura (FtpTypes_v2.0.xsd)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<FileQuadraturaFTP versione="2.0" xmlns="http://www.fatturapa.it/sdi/ftp/v2.0">
  <IdentificativoNodo>02166430856</IdentificativoNodo>
  <DataOraCreazione>2026-02-13T09:00:00</DataOraCreazione>
  <NomeSupporto>FI.02166430856.900.zip</NomeSupporto>
  <NumeroFile>
    <File>
      <Tipo>FE</Tipo>
      <Numero>2</Numero>
    </File>
  </NumeroFile>
</FileQuadraturaFTP>
```

**Vincoli `IdentificativoNodo`** (da XSD):
- Pattern: `[0-9A-Z]{11}` — esattamente 11 caratteri alfanumerici maiuscoli
- Corrisponde alla **P.IVA** del sottoscrittore (Id Nodo dell'accordo)

### 3.4 Nomenclatura File Fattura (dentro lo ZIP)
```
{stringa alfanumerica}_{progressivo}.xml.p7m
```
- **Stringa alfanumerica** (3-30 char): `IT` + identificativo fiscale del trasmittente
  - Es: `IT02166430856` (codice paese + P.IVA)
  - Es: `ITSCZMNL05L21D960T` (codice paese + CF persona fisica)
- **Progressivo**: alfanumerico, max 5 caratteri `[a-zA-Z0-9]`
- **Esempio**: `IT02166430856_00001.xml.p7m`

### 3.5 Dimensioni Massime
| Parametro | Limite |
|-----------|--------|
| **Singolo file nel supporto** | 5 MB |
| **Supporto ZIP** | 150 MB |
| **File per supporto** | max 1000 |

---

## 4. STRUTTURA XML FATTURAPA 1.2.2

### 4.1 Blocco DatiTrasmissione (1.1)
```xml
<DatiTrasmissione>
  <IdTrasmittente>                          <!-- 1.1.1 -->
    <IdPaese>IT</IdPaese>                   <!-- 1.1.1.1 -->
    <IdCodice>02166430856</IdCodice>        <!-- 1.1.1.2 ⚠️ CRITICO -->
  </IdTrasmittente>
  <ProgressivoInvio>00001</ProgressivoInvio> <!-- 1.1.2 -->
  <FormatoTrasmissione>FPR12</FormatoTrasmissione> <!-- 1.1.3 -->
  <CodiceDestinatario>0000000</CodiceDestinatario> <!-- 1.1.4 -->
</DatiTrasmissione>
```

### 4.2 Campo IdCodice (1.1.1.2) — ANALISI CRITICA

#### Cosa dice la specifica FatturaPA
Il campo `IdTrasmittente.IdCodice` (tag 1.1.1.2) identifica il **soggetto trasmittente**, ovvero chi invia la fattura al SdI. Può essere:
- **P.IVA** (11 cifre) per persone giuridiche
- **Codice Fiscale** (16 caratteri alfanumerici) per persone fisiche

#### Cosa dice l'accordo di servizio
L'accordo specifica:
- **Sottoscrittore**: SCOZZARINI, EMMANUEL SALVATORE - **02166430856** (P.IVA)
- **Riferimento**: SCOZZARINI, Emmanuel Salvatore - **SCZMNL05L21D960T** (CF)
- **Id Nodo**: **02166430856**

#### Il problema riscontrato (Errore 00300)
Sogei ha restituito errore 00300 con messaggio:
> "l'identificativo immesso nel campo 'Codice identificativo fiscale' -tag 1.1.1.2 `<IdCodice>` non corrisponde a un c.f. valido"

#### Analisi del problema

**Scenario attuale nel codice:**
Il nostro `xml-generator.js` usa `cedente.id_fiscale_iva.id_codice` (la P.IVA del **cliente**) come `IdTrasmittente.IdCodice`. Questo è **sbagliato** perché:

1. **IdTrasmittente** = chi trasmette = **noi** (RescueManager / Scozzarini) = `02166430856`
2. **CedentePrestatore** = chi emette la fattura = **il cliente** dell'autodemolizione

Quando un nostro cliente (es. Autodemolizioni Rossi S.r.l.) emette una fattura tramite il nostro canale:
- `IdTrasmittente.IdCodice` deve essere `02166430856` (noi, il nodo accreditato)
- `CedentePrestatore.IdFiscaleIVA.IdCodice` deve essere la P.IVA di Rossi S.r.l.

**Ma nel caso specifico dell'errore di test**, il sottoscrittore e il cedente coincidono (stessa P.IVA `02166430856`), quindi l'errore 00300 era dovuto ad **altri dati di test invalidi** nel file XML, non alla P.IVA in sé (che è valida — check digit verificato).

#### Regola corretta per IdTrasmittente.IdCodice

| Scenario | IdTrasmittente.IdCodice | CedentePrestatore.IdCodice |
|----------|------------------------|---------------------------|
| **Noi emettiamo per noi stessi** | `02166430856` (nostra P.IVA) | `02166430856` (nostra P.IVA) |
| **Noi trasmettiamo per un cliente** | `02166430856` (nostra P.IVA = Id Nodo) | P.IVA del cliente |

> **REGOLA:** `IdTrasmittente.IdCodice` deve essere **SEMPRE** l'Id Nodo dell'accordo di servizio = `02166430856`, indipendentemente da chi è il cedente.

### 4.3 Blocco CedentePrestatore (1.2)
```xml
<CedentePrestatore>
  <DatiAnagrafici>
    <IdFiscaleIVA>
      <IdPaese>IT</IdPaese>
      <IdCodice>{P.IVA del cedente}</IdCodice>  <!-- P.IVA di chi emette -->
    </IdFiscaleIVA>
    <CodiceFiscale>{CF del cedente}</CodiceFiscale> <!-- Opzionale -->
    <Anagrafica>
      <Denominazione>{Ragione sociale}</Denominazione>
    </Anagrafica>
    <RegimeFiscale>RF01</RegimeFiscale>
  </DatiAnagrafici>
  <Sede>
    <Indirizzo>{via}</Indirizzo>
    <CAP>{cap}</CAP>
    <Comune>{comune}</Comune>
    <Provincia>{provincia}</Provincia>
    <Nazione>IT</Nazione>
  </Sede>
</CedentePrestatore>
```

### 4.4 Blocco CessionarioCommittente (1.4)
```xml
<CessionarioCommittente>
  <DatiAnagrafici>
    <IdFiscaleIVA>                              <!-- Almeno uno tra questo... -->
      <IdPaese>IT</IdPaese>
      <IdCodice>{P.IVA cliente}</IdCodice>
    </IdFiscaleIVA>
    <CodiceFiscale>{CF cliente}</CodiceFiscale>  <!-- ...e questo (ERRORE 00417) -->
    <Anagrafica>
      <Denominazione>{Nome cliente}</Denominazione>
    </Anagrafica>
  </DatiAnagrafici>
  <Sede>...</Sede>
</CessionarioCommittente>
```

---

## 5. FLUSSO OPERATIVO COMPLETO

### 5.1 Invio Fattura (Nodo → SdI)

```
1. Desktop App: utente crea fattura e clicca "Invia a SDI"
2. Desktop App → API VPS (POST /api/sdi-sftp/send)
   - Invia: invoice_ids, org_id, test_mode
3. VPS Server:
   a. Carica fatture da Supabase
   b. Genera XML FatturaPA per ogni fattura (xml-generator.js)
   c. Firma ogni XML con CAdES-BES (.xml.p7m)
   d. Genera file di quadratura (FileQuadraturaFTP)
   e. Crea ZIP (supporto FI)
   f. Cifra ZIP con chiave pubblica Sogei (AES-256)
   g. Deposita in /var/sftp/sdi/DatiVersoSdI[Test]/
4. SdI (Sogei):
   a. Si connette al nostro SFTP
   b. Preleva il file FI dalla directory
   c. Decifra, verifica firma, valida XML
   d. Deposita esito EO nella directory DatiDaSdI[Test]/
5. VPS Server:
   a. Monitora directory DatiDaSdI[Test]/
   b. Processa notifiche (EO, ER, FO)
   c. Aggiorna stato fattura su Supabase
```

### 5.2 Ricezione Notifiche (SdI → Nodo)

| Tipo Notifica | Significato | Azione |
|---------------|-------------|--------|
| **RC** (Ricevuta Consegna) | Fattura consegnata al destinatario | Aggiorna stato → "consegnata" |
| **NS** (Notifica Scarto) | Fattura scartata per errori | Aggiorna stato → "scartata", mostra errore |
| **MC** (Mancata Consegna) | Impossibilità di recapito | Aggiorna stato → "mancata consegna" |
| **NE** (Notifica Esito) | Esito committente (solo PA) | Aggiorna stato |
| **DT** (Decorrenza Termini) | Termini scaduti (solo PA) | Aggiorna stato |
| **AT** (Attestazione) | Attestazione impossibilità recapito | Aggiorna stato |

### 5.3 Tempi di Elaborazione
- **Prelevamento SdI**: SdI si connette H24, 365 giorni
- **Esito EO**: generalmente entro pochi minuti dal prelevamento
- **Notifica RC/NS**: da pochi minuti a 48 ore
- **Manutenzione SdI**: 00:00 - 00:59 (possibile indisponibilità)

---

## 6. ERRORI SDI COMUNI

### 6.1 Errori di Scarto Fattura (Notifica NS)

| Codice | Descrizione | Causa | Soluzione |
|--------|-------------|-------|-----------|
| **00300** | IdCodice non valido (tag 1.1.1.2) | IdTrasmittente con CF/P.IVA non valido | Usare Id Nodo `02166430856` |
| **00311** | CF non valido in CedentePrestatore | Codice fiscale cedente errato | Verificare CF in anagrafica |
| **00417** | Né P.IVA né CF in CessionarioCommittente | Manca identificativo cliente | Aggiungere P.IVA o CF cliente |
| **00423** | PrezzoTotale incoerente | Qty × Price ≠ PrezzoTotale (±0.01) | Ricalcolare totale riga |
| **00424** | AliquotaIVA non valida | Aliquota < 1.00 e ≠ 0.00 | Correggere aliquota |
| **00427** | CodiceDestinatario lunghezza errata | FPA12→6 char, FPR12→7 char | Verificare codice destinatario |
| **00428** | FormatoTrasmissione incoerente | Attributo versione ≠ FormatoTrasmissione | Allineare formato |
| **00429** | Natura mancante con aliquota 0 | AliquotaIVA=0 senza tag Natura | Aggiungere Natura (N1-N7) |
| **00430** | Natura presente con aliquota ≠ 0 | Tag Natura con AliquotaIVA > 0 | Rimuovere Natura |

### 6.2 Errori di Supporto (Esito ER)

| Codice | Descrizione | Causa |
|--------|-------------|-------|
| **ET02** | Errore supporto | Firma non valida, cifratura errata, quadratura errata |
| **0014** | Errore nel file di quadratura | IdentificativoNodo non corrisponde, NumeroFile errato |

### 6.3 Errori Quadratura (Richiesta RQ)

| Codice | Descrizione |
|--------|-------------|
| **0001** | DataA minore di DataDa |
| **0002** | DataA fuori intervallo permesso |
| **0003** | DataDa fuori intervallo permesso |
| **0004** | Intervallo già richiesto |
| **0005** | Almeno un giorno già richiesto |
| **0016** | Non conformità con tracciato XSD |
| **0017** | Tipologia flusso non ammessa |
| **0018** | Richiesta duplicata |

### 6.4 Errori Reinoltro (Richiesta RR)

| Codice | Descrizione |
|--------|-------------|
| **0006** | File vuoto |
| **0007** | Presenti id non numerici |
| **0008** | Superato numero righe consentite |
| **0009** | Superato limite massimo periodico di reinvii |
| **0012** | File già trasmesso |
| **0013** | Superato numero massimo richieste giornaliere |
| **0014** | Superiore a 5 MB |
| **0015** | Nome file non valido |

---

## 7. SERVIZI MASSIVI (Quadratura e Reinoltro)

### 7.1 Richiesta Quadratura (RQ)
Permette di richiedere un report dei file inviati/ricevuti in un periodo.

**Nomenclatura:** `IT02166430856_RQ_AB001.xml`

**Vincoli:**
- Report SFTP: intervallo max 15 giorni, non oltre 22 giorni indietro, esclusi ultimi 7 giorni
- Report SFTP_FPA: intervallo max 15 giorni, non oltre 30 giorni indietro
- Non si può richiedere lo stesso periodo più volte

**Risposta:** Archivio RQZ con:
- File esito richiesta (ES00=accettata, ES01=scartata)
- Report CSV file-fatture: ID SDI, Nome file, Data ricezione, Tipo, Stato
- Report CSV file-notifica: ID SDI, Nome notifica, Stato, ID SDI fattura

### 7.2 Richiesta Reinoltro (RR)
Permette di richiedere la ritrasmissione di fatture o notifiche già inviate.

**Nomenclatura:**
- Fatture: `IT02166430856_RR_F_AB001.csv`
- Notifiche: `IT02166430856_RR_N_AB001.csv`

**Vincoli:**
- Max 5 MB per file
- Max 10.000 identificativi per richiesta
- Max 100.000 ritrasmissioni/mese per flusso
- Solo file ricevuti tra 7 e 30 giorni fa

---

## 8. BUG IDENTIFICATO E FIX NECESSARIO

### 8.1 Problema Attuale
Nel codice attuale, `IdTrasmittente.IdCodice` viene popolato con la P.IVA del **cedente** (il cliente che emette la fattura), non con l'Id Nodo del sottoscrittore.

**File coinvolti:**
1. `xml-generator.js` (riga 246, 374)
2. `sdi_send/index.ts` (riga 161)
3. `server.js` (riga 532)

**Codice attuale (ERRATO per multi-tenant):**
```javascript
// xml-generator.js:246
let idCodice = cedente.id_fiscale_iva?.id_codice || cedente.id_codice;
// ...
// xml-generator.js:374
<IdCodice>${esc(idCodice)}</IdCodice>  // ← Usa P.IVA del cedente
```

### 8.2 Fix Necessario
L'`IdTrasmittente.IdCodice` deve essere **SEMPRE** l'Id Nodo dell'accordo = `02166430856`.

**Approccio consigliato:**
```javascript
// Costante o variabile d'ambiente
const ID_NODO_TRASMITTENTE = process.env.SDI_ID_NODO || '02166430856';

// Nel XML:
<IdTrasmittente>
  <IdPaese>IT</IdPaese>
  <IdCodice>${esc(ID_NODO_TRASMITTENTE)}</IdCodice>  // ← Sempre Id Nodo
</IdTrasmittente>

// CedentePrestatore usa la P.IVA del cliente:
<CedentePrestatore>
  <DatiAnagrafici>
    <IdFiscaleIVA>
      <IdPaese>IT</IdPaese>
      <IdCodice>${esc(idCodice)}</IdCodice>  // ← P.IVA del cedente
    </IdFiscaleIVA>
  </DatiAnagrafici>
</CedentePrestatore>
```

### 8.3 Impatto
- **Nome file fattura**: `IT{IdNodo}_{progressivo}.xml.p7m` → usa Id Nodo (corretto)
- **Nome supporto ZIP**: `FI.{IdNodo}.{progressivo}.zip` → usa Id Nodo (corretto)
- **File quadratura**: `<IdentificativoNodo>` → usa Id Nodo (corretto)
- **XML IdTrasmittente**: attualmente usa P.IVA cedente → **DA FIXARE** con Id Nodo

---

## 9. DISPONIBILITÀ E SLA

| Parametro | Valore |
|-----------|--------|
| **Orario servizio** | 01:00 - 24:00, Lun-Dom, 365 giorni |
| **Manutenzione ordinaria** | 00:00 - 00:59 |
| **Manutenzione straordinaria** | Max 8 ore per interruzione, max 3/mese |
| **Comunicazione indisponibilità** | Via email + sito fatturapa.gov.it |

---

## 10. REVOCA E CHIUSURA

| Evento | Condizione |
|--------|-----------|
| **Revoca accreditamento** | Test non completati entro 90 giorni dalla richiesta |
| **Chiusura canale** | Nessun flusso (in/out) per un intero anno solare |

> **ATTENZIONE:** Se il canale non viene usato per tutto il 2026, verrà chiuso d'ufficio.

---

## 11. RIFERIMENTI

### 11.1 Documenti Allegati all'Accordo
- `FtpTypes_v2.0.xsd` — Schema XSD per file di quadratura e esito
- `Specifiche_tecniche_FTP_v4.1.1.pdf` — Istruzioni complete SDIFTP

### 11.2 Manuali nel Repository
- `moduli/SDI-SFTP/manuali/Istruzioni-SDIFTP-v4.3` — Manuale SFTP v4.3
- `moduli/SDI-SFTP/manuali/FtpTypes_v2.0.xsd` — Schema XSD
- `moduli/SDI-SFTP/manuali/SDI_SFTP_Massivi_v2` — Nota sicurezza massivi
- `moduli/SDI-SFTP/manuali/SMQREsitoRichiestaTypes_v1.0.xsd` — Schema esito richiesta
- `moduli/SDI-SFTP/manuali/SMQRListaRichiesteReportQuadraturaTypes_v1.0.xsd` — Schema quadratura

### 11.3 Codice Sorgente
- `moduli/SDI-SFTP/server-vps/server.js` — Server principale
- `moduli/SDI-SFTP/server-vps/xml-generator.js` — Generatore XML FatturaPA
- `desktop-app/.../supabase/functions/sdi_send/index.ts` — Edge Function alternativa

### 11.4 Contatti Sogei
- **Sito**: www.fatturapa.gov.it
- **PEC**: sdi01@pec.fatturapa.it
- **Sezione accreditamento**: www.fatturapa.gov.it → "Sistema di Accreditamento"

---

## 12. CHECKLIST OPERATIVA

### Prima di andare in produzione:
- [ ] Fix `IdTrasmittente.IdCodice` → usare sempre Id Nodo `02166430856`
- [ ] Verificare che i certificati non siano scaduti
- [ ] Completare test di interoperabilità con Sogei
- [ ] Verificare test di carico (supporti fino a 150 MB)
- [ ] Verificare test di contemporaneità
- [ ] Passare `SDI_SFTP_TEST_MODE` da `true` a `false`
- [ ] Aggiornare directory da `DatiVersoSdITest` a `DatiVersoSdI`
- [ ] Comunicare a Sogei la conclusione dei test
- [ ] Verificare che il canale sia usato almeno 1 volta/anno per evitare chiusura
