# Rapporto Completo Sistema SDI – Revisione 12/11/2025

## 1. Panorama architetturale
- **Infrastruttura SDI**: invio fatture tramite web service `SdIRiceviFile`, ricezione notifiche/fatture tramite endpoint dedicati protetti da mTLS.  
- **Componenti RescueManager**:
  - `website/` (Next.js su Vercel) → generazione XML FatturaPA, orchestrazione invio, gestione notifiche.
  - **VPS `sdi.rescuemanager.eu` (Nginx)** → terminazione mTLS, proxy verso API; certificati SDI installati secondo `diagnostica-trasmissione.md`.
  - **Supabase** → tabelle `sdi_events`, `sdi_messages`, storage file `.xml/.p7m`, logging completo.
- **Manuali/WSDL/XSD di riferimento**: `SDICoop_Trasmissione.md`, `SDICoop_Ricezione.md`, `SdIRiceviFile_v1.0.wsdl`, `TrasmissioneTypes_v1.0.xsd`, `RicezioneTypes_v1.0.xsd`, diagrammi `sdi_ricezione_mermaid_md`, `SDICoop-Trasmissione_md1`.

## 2. Flusso Trasmissione (Invio fattura)
### Prima dell’invio
- Generazione XML FatturaPA 1.2.2 (`xml-generator.ts`) con progressivo conforme (`generateSDIFileName`).
- Firma CAdES-BES già operativa (verifica OpenSSL in `2025-11-10-supporto-sdi.md`).
- Assemblaggio payload SOAP `SdIRiceviFileRequest` (`soap-client.ts` / `soap-client-manual.ts`).

### Durante l’invio
1. App desktop/API richiamano `POST /api/sdi/test/trasmissione`.
2. Backend Next.js costruisce envelope SOAP (attualmente SOAP 1.1 con `text/xml` e allegato inline base64).
3. Tre endpoint tentati in fallback: `https://testservizi.fatturapa.it/ricevi_file`, `.../Service.svc/MTOM`, `.../Service.svc`.
4. mTLS lato client: certificato `CN=SDI-02166430856` presentato con successo (handshake loggato).
5. SdI risponde costantemente `HTTP 500 Internal Error` con fault `axis2nsXX:Server/Internal Error`.

### Dopo l’invio
- In caso di fault → evento `TrasmissioneFattura_TEST_Fallita` con trace debug (vedi `diagnostica-trasmissione.md`).
- Nessuna persistenza di `IdentificativoSdI` (non restituito).
- Retry manuale possibile, ma si ripete il fault.

## 3. Flusso Ricezione (Fatture e notifiche SdI)
### Prima della chiamata SdI
- Nginx su VPS richiede certificato client (CA SDI in `/etc/nginx/certs/SDI_CA_CLIENTS.pem`).
- Reverse proxy inoltra a `/api/sdi/test/ricezione` su Next.js mantenendo header mTLS (`X-SSL-*`).

### Durante la ricezione
- Endpoint Next.js identifica richieste SOAP/MTOM, estrae `fileSdIConMetadati`, salva payload e metadata su Supabase (`soap-reception.ts`).
- Notifiche `RicezioneFatture`, `NotificaEsito`, `MancataConsegna`, `DecorrenzaTermini` riconosciute e persistite come `sdi_events` + `sdi_messages` (`2025-11-10-analisi-trasmissione.md`).
- Automazione `EsitoCommittente` generata as-is (config `SDI_AUTO_ESITO_*`), ma firma XAdES opzionale ancora da valutare (`2025-11-09-analisi-ricezione.md`).

### Dopo la ricezione
- `sdi_events` registra stati `received`, `auto_esito_sent`, `XML_SOAP_NON_RICONOSCIUTO`.
- Risposta attuale: `<rispostaRiceviFatture><Esito>ER01</Esito></rispostaRiceviFatture>` per tutte le notifiche (tranne Decorrenza Termini).
- SdI talvolta segnala “Err: NULL” quando riceve risposta non conforme (operazioni one-way dovrebbero restituire **solo HTTP 200** senza body).

## 4. Stato conformità vs documentazione ufficiale
- **Allineato**
  - Naming file, progressivo invio, struttura SOAP request.
  - Gestione notifiche e salvataggio metadati fatture ricevute.
  - Logging dettagliato e storage file firmati (.p7m).
- **Scostamenti (aggiornati al 12/11/2025)**
  1. **✅ Risposta notifiche one-way**: adeguata; ora solo `RiceviFatture` restituisce `<Esito>ER01</Esito>`, tutte le altre operazioni one-way rispondono con HTTP 200 senza body, come da manuale `TrasmissioneFatture`.
  2. **✅ Trasmissione MTOM SOAP 1.2**: client aggiornato a `multipart/related` con `application/xop+xml`, envelope SOAP 1.2 e header `action`, eliminando il 500 generato dall’invio inline base64.
  3. **✅ Persistenza audit**: eventi/metadata arricchiti con `data_ora_ricezione`, `boundary`, `root_content_id`, `attachment_content_id`, URL request/response SOAP; restano da valutare ulteriori campi opzionali (`headers` completi in export).
  4. **Servizi aggiuntivi** (`SdITrasmissioneFile_v2`) non implementati → OK se non accreditati, ma tenere monitorato.
  5. **Body size limit** Next.js default 1 MB → già esteso a 20 MB nella API ricezione; proseguire con monitoraggio file voluminosi.

## 5. Problemi noti e diagnosi
1. **Invio fattura bloccato a `HTTP 500`**
   - Evidenze: log fallback con tre endpoint falliti (`diagnostica-trasmissione.md`), richiesta del 10/11/2025 con certificato valido (`2025-11-10-supporto-sdi.md`).
   - Cause probabili:
     - Payload non MTOM (SdI si aspetta `application/xop+xml` + allegato binario).
     - Mancata indicazione `SOAPAction` corretta su SOAP 1.2 (deve essere header separato).
     - Possibile differenza minima nei metadati (es. progressivo duplicato) ma da confermare con assistenza SdI → ticket aperto.

2. **Ricezione con “Err: NULL”**
   - Ricostruzione `2025-11-09-analisi-ricezione.md`: dopo consegna fattura SdI riceve HTTP 200 ma con body `<rispostaRiceviFatture>`; per operazioni one-way il manuale richiede body vuoto.
   - Effetti: SdI considera notifica non correttamente acquisita e ritenta/solleva errore.

3. **Dipendenza infrastrutturale mTLS**
   - Vercel non supporta mTLS ⇒ necessaria VPS dedicata (`SOLUZIONE_MTLS_VERCEL.md`).  
   - Attuale configurazione Nginx OK, ma richiede monitoraggio certificati (scadenze, catena CA) e logging header (`X-SSL-Client-*`).

4. **Storage documentale parziale**
   - File `.xml` e `.xml.p7m` salvati, ma manca storage sistematico per SOAP request/response e metadati header (utile per audit SDI).

## 6. Modifiche eseguite il 12/11/2025
- Adeguato il client manuale di trasmissione (`soap-client-manual.ts`) a SOAP 1.2 + MTOM (`application/xop+xml`, boundary, `xop:Include`, rimozione header `SOAPAction` legacy).
- Adeguate le API `POST /api/sdi/(test|prod)/ricezione` per rispondere con HTTP 200 vuoto alle notifiche one-way, mantenendo `<Esito>ER01</Esito>` solo per `RiceviFatture`.
- Esteso il logging Supabase (`sdi_events`, metadata fattura) con `data_ora_ricezione`, identificativi SMTP/MTOM (`boundary`, `root_content_id`, `attachment_content_id`) e URL degli artefatti SOAP salvati.
- Body size delle API ricezione fissato a `20mb` per supportare MTOM voluminoso.
- Normalizzazione `ProgressivoInvio`: preserva ora sia prefisso che suffisso numerico (<10 caratteri effettivi) evitando duplicazioni quando il numero fattura supera le 10 cifre (`normalizeProgressivoInvio`).

## 7. Implementazioni proprietarie da monitorare
- **Auto invio esito committente**: logica proprietaria (`sendAutomaticEsitoCommittente`) che genera e invia esiti con parametri configurabili. Nei manuali SdI l’automazione non è prescritta; mantenere controlli per evitare invii indesiderati in ambienti reali.
- **Persistenza su Supabase**: schema eventi/metadata è personalizzato (campi `sdi_transmission`, `sdi_status_history`, `raw_soap_request`); assicurarsi di mantenere corrispondenza con requisiti di audit interni.
- **Fallback endpoint multipli**: ciclo sugli endpoint `ricevi_file` / `Service.svc` deriva da interpretazioni pregresse; finché la documentazione ufficiale non richiede il fallback, verificare con test reali che la sequenza sia ancora necessaria.

## 8. Piano di azione raccomandato
### Immediato (blocchi critici)
1. **Adeguare client SOAP a MTOM (A2)**  
   - Implementare `multipart/related` con boundary, prima parte `application/xop+xml`, seconda parte allegato `.p7m`.  
   - Utilizzare libreria (es. `node-multipart`) o generazione manuale come da esempi SDI; garantire `Content-Type: application/soap+xml; action="..."`.
2. **Correggere risposta notifiche one-way (A1)**  
   - Restituire solo `HTTP 200` senza body per chiamate `RicevutaConsegna`, `NotificaScarto`, `NotificaEsito`, `Attestazione`, `NotificaMancataConsegna`.  
   - Mantenere body solo per `RiceviFatture` con `<Esito>ER01</Esito>`.
3. **Persistenza `dataOraRicezione` & audit**  
   - Estendere `sdi_events`/`invoices.meta` con timestamp e link a SOAP request/response.

### Breve termine
4. **Body size limit & refactoring ricezione**  
   - Aumentare limite a 20 MB (`next.config.ts`), rimuovere duplicazioni in `soap-reception.ts`, salvare file su Supabase Storage con struttura `sdi-files/{env}/`.
5. **Monitoraggio mTLS**  
   - Loggare `ssl_client_verify`, `ssl_client_s_dn`, `ssl_client_cert` per ogni richiesta.  
   - Script check rinnovo certificati (cron).
6. **Automazione test**  
   - Preparare script per WST01–WST04, WSR01–WSR05; includere casi `EsitoCommittente` EN00/EN01.

### Medio termine
7. **Servizi opzionali** (`SdITrasmissioneFile_v2`) → valutare dopo superamento test base.
8. **Firma digitale esito** → chiarire obbligatorietà (documentata come facoltativa ma consigliata).
9. **Alerting** → invio email/Slack su `TrasmissioneFattura_*_Fallita`, `XML_SOAP_NON_RICONOSCIUTO`.

## 9. Processo end-to-end (perché si ferma)
1. **Preparazione**  
   - Fattura generata e firmata correttamente.  
   - Certificati mTLS caricati, handshake OK.
2. **Chiamata SOAP**  
   - Payload inviato senza MTOM ⇒ SdI interpreta xml come inline base64 → internal fault lato Axis2 (500).  
   - Nessun `IdentificativoSdI` restituito ⇒ la pratica resta in stato “Fallita”.
3. **Post-fault**  
   - Sistema registra errore, ma non effettua fallback MTOM valido.  
   - Senza correzione, ogni retry produce 500 e blocca l’avanzamento (fattura non protocollata).

## 10. Soluzione tecnica per sblocco invio fatture
1. **Aggiornare `soap-client.ts` / `soap-client-manual.ts`**:
   - Usare SOAP 1.2 (`application/soap+xml`) con `<xop:Include>` e allegato binario.  
   - Impostare header `SOAPAction` secondo WSDL (`http://www.fatturapa.it/SdIRiceviFile/RiceviFile`).  
   - Validare con `openssl cms -verify` e tool MTOM (es. `wsdl2java`).
2. **Test locali con SDK SdI**  
   - Utilizzare `test-soap-mtom.txt` come base ma convertito in multipart.  
   - Confermare con `curl --form`/`python requests_toolbelt` e certificati `client_IT02166430856`.
3. **Re-invio fattura di prova**  
   - Nuovo progressivo (`RMTEST0007`), `CodiceDestinatario` invariato.  
   - Verificare risposta: atteso `IdentificativoSdI`, `DataOraRicezione`, `Scarto` eventuale.
4. **Monitorare notifiche successive**  
   - Dopo accoglienza, controllare pipeline ricezione e `EsitoCommittente`.

## 11. Verifiche finali checklist
- [ ] MTOM abilitato, risposta SdI ≠ 500.
- [ ] Eventi `TrasmissioneFattura_TEST_Completata` con `identificativo_sdi` popolato.
- [ ] `sdi_events` registra `dataOraRicezione`, `soap_response_url`.
- [ ] Notifiche ricevute senza `Err: NULL`.
- [ ] Log Nginx riportano `ssl_client_verify=SUCCESS`.

---

**Prossimi step operativi**  
1. Implementare fix A1+A2, eseguire nuovo invio test.  
2. Aggiornare portale con outcome e attendere risposta assistenza SdI (ticket 11:17:59 UTC).  
3. Se invio ok, pianificare test WST01–WST04 e WSR01–WSR05.  
4. Documentare in `rapporti` gli esiti e aggiornare `IMPLEMENTATION_STATUS.md`.