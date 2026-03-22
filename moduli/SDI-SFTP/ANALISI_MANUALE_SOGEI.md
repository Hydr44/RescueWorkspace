# 📖 Analisi Manuale Sogei - Scambio Dati SFTP

## 📄 Documento Analizzato
**Manuale.Scambio.Dati.pdf** - Modulo per scambio dati telematico via "Secure File Transfer" - Canali SDIFTP

---

## 🔑 Punti Chiave dal Manuale

### 1. Modalità Trasmissive

- **Sogei → Ente**: Sogei invia flussi in uscita e certifica con **Rename** del file
- **Ente → Sogei**: Sogei preleva flussi dalla periferia e certifica con **Cancellazione** del file

### 2. Requisiti Ente

L'Ente deve:
- ✅ Esporre un **server SFTP** su porta 22
- ✅ Assegnare **un'unica utenza** di accesso
- ✅ Autorizzare **entrambi i certificati .pub** forniti da Sogei
- ✅ Abilitare sui firewall gli **IP pubblici Sogei**

### 3. Collegamento Rete

#### IP Pubblici Sogei da Abilitare

| Ambiente | IP Client | Descrizione |
|----------|-----------|-------------|
| **Internet** | 217.175.54.31 | Client SFTP principale |
| **Internet DR** | 217.175.56.129 | Client SFTP Disaster Recovery |
| **SPC Infranet** | 217.175.48.25 | Client SFTP principale SPC |
| **SPC Infranet DR** | 217.175.56.25 | Client SFTP DR SPC |

**Porta**: 22 (SSH/SFTP standard)

#### Note Importanti
- Se si usa sia Internet che SPC, utilizzare **piani di indirizzamento pubblici** diversi per evitare routing asimmetrico
- Per PA: DigitPa raccomanda uso di **SPC Infranet** tra Pubbliche Amministrazioni

### 4. Directory Richieste

#### Produzione
- `/DatiDaSdI`
  - **Permessi**: `put`, `rename`
  - **Contenuto**: File FO (fatture), EO (esiti), ER (scarti) da SDI
  
- `/DatiVersoSdI`
  - **Permessi**: `get`, `delete`
  - **Contenuto**: File FI (fatture) da inviare a SDI

#### Test
- `/DatiDaSdITest`
  - **Permessi**: `put`, `rename`
  - **Contenuto**: Come `/DatiDaSdI` ma per ambiente test
  
- `/DatiVersoSdITest`
  - **Permessi**: `get`, `delete`, `sovrascrittura`
  - **Contenuto**: Come `/DatiVersoSdI` ma per ambiente test

### 5. Naming Convention File

#### File da Ente a SDI (FI - Fatture Inviate)
```
FI.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip
```

**Componenti**:
- `FI.` = Prefisso fisso
- `IdNodo` = P.IVA/CF di registrazione al servizio
- `aaaaggg` = Anno e giorno giuliano (001-366)
- `hhmm` = Ora e minuti di predisposizione
- `nnn` = Progressivo numerico:
  - **Produzione**: 000-899
  - **Test**: 900-999

**Estensione**: Solo `.zip` (file firmati e cifrati ma senza estensioni aggiuntive)

#### File da SDI a Ente

**EO - Esiti**:
```
EO.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.xml
```
- Esito verifiche SDI
- File in chiaro

**ER - Scarti**:
```
ER.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.run
```
- Notifica di scarto (errore decifratura o verifica firma)
- File in chiaro
- Estensione `.run` aggiunta solo a trasferimento completato

**FO - Fatture Ricevute**:
```
FO.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip.p7m.enc
```
- Fatture compresse, firmate e cifrate
- Estensione `.p7m.enc` aggiunta solo a trasferimento completato

**ST - Report Statistici**:
```
ST.{IdNodo}.FI.{aaaaggg}.{hhmm}.csv.run  # Riepilogo supporti FI acquisiti
ST.{IdNodo}.FO.{aaaaggg}.{hhmm}.csv.run  # Riepilogo supporti FO trasmessi
```
- Report CSV con riepilogo ultime 5 giornate
- Disponibili dal lunedì al venerdì
- Estensione `.run` aggiunta solo a trasferimento completato

### 6. Limiti e Controlli

#### Dimensione File
- **Massima**: 150 MB
- **Minima**: > 0 bytes

#### Controlli Automatici Client Sogei
Prima del prelievo, Sogei verifica:
1. ✅ Correttezza formale nomenclatura
2. ✅ Corrispondenza path/nomenclatura
3. ✅ Limiti dimensionali (0 < size < 150 MB)
4. ✅ Duplicazione trasmissione (file già acquisiti non vengono prelevati)

**In caso di errore**:
- Mail automatica con anomalia
- Tentativi: 3 volte
- Dopo 3 tentativi: file rinominato per inibire prelievo

#### Gestione File in Creazione
- File in corso di creazione **non devono** avere prefisso "FI."
- Alternativa: creare file in altra cartella e spostare solo quando completo

### 7. Polling Sogei

Sogei effettua **polling permanente** per controllare presenza file in `/DatiVersoSdI`.

### 8. Estensioni File

**IMPORTANTE**: Le estensioni `.p7m.enc`, `.xml`, `.run` vengono aggiunte solo **dopo trasferimento completato**.

- File senza estensione finale = **file parziale/non integro**
- Processare solo file con estensione finale completa

### 9. Crittografia e Firma

- File devono essere **firmati e cifrati** prima dell'invio
- Utilizzare algoritmi conformi alle specifiche SDI
- Vedere documento **SDI_SFTP_Massivi_v2.pdf** per dettagli algoritmi

### 10. Supporto e Assistenza

#### Servizicrittograficiftp@sogei.it
- ✅ Problemi collegamento SFTP
- ✅ Problemi trasmissione file
- ✅ Problemi gestione crittografica file

#### Cosa NON gestiscono:
- ❌ Elaborazione documenti trasmessi
- ❌ Produzione esiti EO
- ❌ Gestione codici destinatari
- ❌ Area riservata portale
- ❌ Verifiche su singola fattura

Per questi: **canali assistenza su fatturapa.gov.it**

---

## 🔄 Workflow Operativo

### Invio Fattura (Ente → SDI)
1. Genera file XML fattura
2. Firma e cifra file → `FI.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip`
3. Carica in `/DatiVersoSdI` (o `/DatiVersoSdITest` per test)
4. Sogei polling preleva file
5. Sogei elimina file dopo acquisizione
6. Sogei processa e genera esito

### Ricezione Fattura (SDI → Ente)
1. SDI genera file FO firmato e cifrato
2. SDI carica in `/DatiDaSdI` come `FO.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip`
3. SDI rinomina aggiungendo `.p7m.enc` quando trasferimento completo
4. Ente rileva file con estensione completa
5. Ente scarica, decifra e processa

### Ricezione Esiti (SDI → Ente)
1. SDI genera esito EO o scarto ER
2. SDI carica in `/DatiDaSdI` come `EO.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.xml` o `ER.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.run`
3. Estensione aggiunta solo a trasferimento completo
4. Ente processa solo file con estensione completa

---

## ⚠️ Note Critiche

1. **File in creazione**: Non devono avere prefisso "FI." o verranno prelevati prematuramente
2. **Estensioni**: Processare solo file con estensione finale (`.xml`, `.run`, `.p7m.enc`)
3. **Progressivi**: Test usa 900-999, Produzione 000-899
4. **Dimensioni**: Max 150 MB per file
5. **Duplicati**: File già acquisiti non vengono riprelevati
6. **Polling**: Sogei controlla continuamente `/DatiVersoSdI`

