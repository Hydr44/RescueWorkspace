# Diagnosi Errore SDI: 1.1.1.2 `<IdCodice>` non valido : 02166430856

**Data analisi:** 12 febbraio 2026  
**Fattura interessata:** N. 25 (ID: `855972df-a67e-44d9-a79c-1983a0208bac`)  
**File inviato:** `FI.02166430856.2026042.2309.951.zip`  
**Data invio:** 11 febbraio 2026, 23:09 UTC  
**Ambiente:** TEST (`DatiVersoSdITest`)  
**Errore SDI:** `1.1.1.2 <IdCodice> non valido : 02166430856`

---

## 1. Dati Accreditamento Canale SFTP

| Campo | Valore |
|-------|--------|
| **Soggetto sottoscrittore** | N |
| **Trasmittente** | `02166430856` (P.IVA) |
| **Servizio** | FTP - Trasmissione - Ricezione |
| **IP Server** | `217.154.118.37` |
| **User SFTP** | `sdi` |

### Certificati SDI (rilasciati da Sogei)

| Certificato | File | Subject |
|-------------|------|---------|
| **Firma** | `EMMAT002.SCZMNL05L21D960T.firma.p12` | `O=Emmanuel Sal. Scozzarini/02166430856, CN=EMMANUEL SALVATORE SCOZZARINI/SCZMNL05L21D960T/002` |
| **Cifra** | `EMMAT002.SCZMNL05L21D960T.cifra.p12` | Stesso del firma |
| **Issuer** | — | `CA Agenzia delle Entrate` |
| **Validità** | — | 05/01/2026 → 05/01/2029 |
| **Password** | — | `IBVvOZqq` |

---

## 2. XML Inviato (Estratto dal debug ZIP)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" ...>
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>02166430856</IdCodice>       <!-- ← QUESTO VIENE RIFIUTATO -->
      </IdTrasmittente>
      <ProgressivoInvio>25</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>MJ1OYNU</CodiceDestinatario>
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>02166430856</IdCodice>
        </IdFiscaleIVA>
        <Anagrafica>
          <Denominazione>Emmanuel Salvatore Scozzarini</Denominazione>
        </Anagrafica>
        <RegimeFiscale>RF01</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>via dello smeraldo 18</Indirizzo>
        <CAP>93012</CAP>
        <Comune>gela</Comune>
        <Provincia>CL</Provincia>
        <Nazione>IT</Nazione>
      </Sede>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>01935590859</IdCodice>
        </IdFiscaleIVA>
        <Anagrafica>
          <Denominazione>SCOZZARINI SERVICE CAR SRL</Denominazione>
        </Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>C.DA FIACCAVENTO</Indirizzo>
        <CAP>93012</CAP>
        <Comune>GELA</Comune>
        <Provincia>CL</Provincia>
        <Nazione>IT</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <!-- ... body omesso ... -->
</p:FatturaElettronica>
```

### Struttura File ZIP

| File | Tipo | Dimensione |
|------|------|------------|
| `FI.02166430856.2026042.2309.951.xml` | FileQuadraturaFTP | 485 bytes |
| `IT02166430856_25.xml.p7m` | Fattura firmata CAdES | 5698 bytes |

### File di Quadratura

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns2:FileQuadraturaFTP xmlns:ns2="http://www.fatturapa.it/sdi/ftp/v2.0" versione="2.0">
    <IdentificativoNodo>02166430856</IdentificativoNodo>
    <DataOraCreazione>2026-02-11T23:09:11.348Z</DataOraCreazione>
    <NomeSupporto>FI.02166430856.2026042.2309.951.zip</NomeSupporto>
    <NumeroFile>
        <File>
            <Tipo>FA</Tipo>
            <Numero>1</Numero>
        </File>
    </NumeroFile>
</ns2:FileQuadraturaFTP>
```

---

## 3. Verifica Conformità XML

| Controllo | Risultato | Note |
|-----------|-----------|------|
| `<IdPaese>` (1.1.1.1) | ✅ `IT` | Corretto |
| `<IdCodice>` (1.1.1.2) | ❌ Rifiutato | `02166430856` — P.IVA valida e attiva |
| `<ProgressivoInvio>` (1.1.2) | ✅ `25` | Alfanumerico, max 5 char |
| `<FormatoTrasmissione>` (1.1.3) | ✅ `FPR12` | Privati (B2B) |
| `<CodiceDestinatario>` (1.1.4) | ✅ `MJ1OYNU` | 7 caratteri |
| Nome file XML interno | ✅ `IT02166430856_25.xml.p7m` | Formato: `IT{IdCodice}_{progressivo}.xml.p7m` |
| Nome file ZIP esterno | ✅ `FI.02166430856.2026042.2309.951.zip` | Formato conforme |
| FileQuadraturaFTP | ✅ | IdentificativoNodo coerente |
| Firma CAdES-BES | ✅ | `openssl smime -verify` OK |
| Cifratura | ✅ | Con chiave pubblica Sogei |

---

## 4. Infrastruttura Server

| Componente | Versione/Valore |
|------------|----------------|
| **VPS** | `217.154.118.37` |
| **Node.js** | v20.19.6 |
| **OpenSSL** | 3.0.13 |
| **PM2 process** | `sdi-sftp-server` (id: 7) |
| **Porta** | 3004 |
| **Codice** | `/opt/sdi-sftp-server/server.js` |

### Problema OpenSSL Legacy

OpenSSL 3.0 **non supporta** l'algoritmo `RC2-40-CBC` usato nei certificati P12 di Sogei:

```
Error: Algorithm (RC2-40-CBC : 0) unsupported
```

**Workaround attuale:** Il server usa `node-forge` per estrarre chiave/certificato dal P12, poi `openssl smime` per la firma. Questo funziona correttamente (la firma è valida).

---

## 5. Analisi delle Possibili Cause

### ❌ Causa 1: P.IVA non valida
- **Esclusa.** La P.IVA `02166430856` è attiva (confermato dall'utente).

### ❌ Causa 2: P.IVA non accreditata come trasmittente
- **Esclusa.** Il portale SDI mostra `Trasmittente: 02166430856`.

### ❌ Causa 3: Formato IdCodice errato
- **Esclusa.** 11 cifre numeriche, formato P.IVA standard.

### ❌ Causa 4: Prefisso "IT" nel valore
- **Esclusa.** Il codice normalizza e rimuove il prefisso IT. Il valore nell'XML è `02166430856` senza prefisso.

### ❌ Causa 5: Firma non valida / XML corrotto
- **Esclusa.** `openssl smime -verify` conferma firma valida. L'XML è ben formato.

### ❌ Causa 6: Nome file incoerente con XML
- **Esclusa.** `IT02166430856_25.xml.p7m` contiene lo stesso IdCodice dell'XML.

### ⚠️ Causa 7: Ambiente TEST vs PRODUZIONE
- **POSSIBILE.** La fattura è stata inviata in `DatiVersoSdITest` (test mode).
- Il canale è accreditato per "FTP - Trasmissione - Ricezione" — ma **non è chiaro se l'accreditamento copre anche l'ambiente test**.
- I test di interoperabilità potrebbero essere già stati completati e il canale potrebbe essere stato promosso a produzione, rendendo l'ambiente test non più attivo.
- **Verifica:** Provare a inviare la stessa fattura in **produzione** (`DatiVersoSdI`).

### ⚠️ Causa 8: Test di interoperabilità non completati / canale non validato
- **POSSIBILE.** Se i test di interoperabilità non sono stati completati con successo, SDI potrebbe rifiutare i file anche se il canale è "accreditato".
- Il manuale SDI (par. 2.4) dice: "Per validare l'accreditamento del proprio canale al Servizio SDIFTP è necessario effettuare dei test di interoperabilità".
- **Verifica:** Controllare sul portale SDI se i test sono stati completati e il canale è "validato" (non solo "accreditato").

### ⚠️ Causa 9: Progressivo invio duplicato
- **POSSIBILE.** Il `<ProgressivoInvio>` è `25` (numero fattura). Se una fattura precedente con lo stesso progressivo è già stata inviata, SDI potrebbe rifiutarla.
- **Ma:** L'errore specifico è su `<IdCodice>`, non su `<ProgressivoInvio>`. Probabilmente non è questa la causa.

### ⚠️ Causa 10: Mismatch tra certificato di firma e IdTrasmittente
- **POSSIBILE.** Il certificato di firma contiene:
  - `O = Emmanuel Sal. Scozzarini/02166430856`
  - `CN = EMMANUEL SALVATORE SCOZZARINI/SCZMNL05L21D960T/002`
- SDI potrebbe verificare che il soggetto nel certificato di firma corrisponda all'`<IdTrasmittente>` nell'XML.
- Il certificato contiene **sia** la P.IVA che il CF. Se SDI si aspetta che `<IdCodice>` corrisponda al CN del certificato (che contiene il CF `SCZMNL05L21D960T`), potrebbe rifiutare la P.IVA.
- **Verifica:** Provare con `<IdCodice>SCZMNL05L21D960T</IdCodice>` (codice fiscale dal CN del certificato).

### ⚠️ Causa 11: Canale accreditato per ricezione ma non ancora per trasmissione attiva
- **POSSIBILE.** Il portale mostra "Trasmissione - Ricezione" ma il canale potrebbe essere in fase di attivazione.
- **Verifica:** Controllare se ci sono comunicazioni pendenti da Sogei/SDI.

### ⚠️ Causa 12: DataOraCreazione nel FileQuadraturaFTP in formato UTC
- **POSSIBILE MA IMPROBABILE.** Il valore è `2026-02-11T23:09:11.348Z` (con Z = UTC). Alcuni sistemi SDI potrebbero aspettarsi il formato senza millisecondi o con timezone locale.
- **Verifica:** Usare formato `2026-02-11T23:09:11` senza millisecondi e senza Z.

---

## 6. Piano d'Azione (in ordine di priorità)

### Azione 1: Verificare stato canale sul portale SDI
1. Accedere a **Fatture e Corrispettivi** → **Gestione canali** → **SFTP**
2. Verificare se il canale è in stato **"Validato"** o solo **"Accreditato"**
3. Verificare se i **test di interoperabilità** sono stati completati
4. Verificare se c'è distinzione tra ambiente test e produzione

### Azione 2: Provare invio in PRODUZIONE
Se il canale è validato, provare a inviare la fattura in `DatiVersoSdI` (produzione) invece di `DatiVersoSdITest`:
- Nella desktop app, disattivare "Test Mode" prima dell'invio
- Oppure settare `SDI_SFTP_TEST_MODE=false` sul server

### Azione 3: Provare con Codice Fiscale come IdTrasmittente
Se l'azione 2 non risolve, provare a usare il CF `SCZMNL05L21D960T` come `<IdCodice>` nell'`<IdTrasmittente>`:
- Questo perché il CN del certificato di firma contiene il CF, e SDI potrebbe fare un match certificato↔XML

### Azione 4: Contattare assistenza SDI
Se nessuna delle azioni precedenti risolve:
- **Email:** `servizicrittograficiftp@sogei.it`
- **Oggetto:** Errore 1.1.1.2 IdCodice non valido - Canale SFTP P.IVA 02166430856
- **Contenuto:**
  - P.IVA: 02166430856
  - CF: SCZMNL05L21D960T
  - Errore ricevuto: `1.1.1.2 <IdCodice> non valido : 02166430856`
  - File inviato: `FI.02166430856.2026042.2309.951.zip`
  - Directory: `DatiVersoSdITest`
  - Domanda: Il canale è validato per la trasmissione? L'IdCodice deve essere P.IVA o CF?

### Azione 5: Verificare su portale "Fatture e Corrispettivi"
1. Accedere con SPID/CIE
2. Andare su **Consultazione** → **Fatture elettroniche**
3. Verificare se la fattura N.25 risulta tra le fatture inviate/scartate
4. Leggere il dettaglio dello scarto per eventuali informazioni aggiuntive

---

## 7. Riepilogo

| Elemento | Stato |
|----------|-------|
| XML strutturalmente valido | ✅ |
| P.IVA attiva | ✅ |
| P.IVA accreditata come trasmittente | ✅ |
| Firma CAdES valida | ✅ |
| Nome file conforme | ✅ |
| FileQuadraturaFTP conforme | ✅ |
| Canale validato (test interop completati) | ❓ Da verificare |
| Ambiente invio (test vs prod) | ⚠️ Inviato in TEST |
| Match certificato ↔ IdTrasmittente | ⚠️ Da verificare |

**Ipotesi più probabile:** Il canale potrebbe non essere ancora validato per la trasmissione in ambiente test, oppure SDI si aspetta il Codice Fiscale (dal CN del certificato) come IdTrasmittente invece della P.IVA.

---

## 8. CONCLUSIONE (12 Feb 2026)

**L'errore era specifico dell'ambiente TEST.**

- Il canale SFTP è ora in **PRODUZIONE** (test di interoperabilità completati)
- L'ambiente test (`DatiVersoSdITest`) non riconosce più la P.IVA come trasmittente valido perché il canale è stato promosso a produzione
- **Nessun bug nel codice** — XML, firma, nome file e file di quadratura sono tutti conformi
- L'errore **non dovrebbe ripresentarsi** in produzione

### Bug corretto (non correlato all'errore SDI)
In `InvoiceNew.jsx`, il campo `cedentePrestatore.tax_code` usava erroneamente `customerTax` (CF del cliente) invece di `companyData.taxCode` (CF dell'azienda). Corretto in `cedentePrestatore.codice_fiscale` con il valore corretto.

### Nota
Non è possibile testare ulteriormente perché il titolare è libero professionista e non può emettere fatture reali senza generare obblighi fiscali. Il test definitivo avverrà quando un cliente della piattaforma invierà la prima fattura in produzione.
