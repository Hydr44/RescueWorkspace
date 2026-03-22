## RVFU – Struttura dati (da RVFU.json)

Fonte: `rvfu/RVFU.json` (spec OpenAPI).

### Radice

- **openapi**
- **info**
  - `title`, `description`, `termsOfService`, `contact`, `license`, `version`
- **servers** (array)
  - `[0].url`, `[0].description`
- **tags** (array, ~21 voci)
  - Ogni tag ha `name`, `description`
- **paths**
  - Elenco di endpoint REST:
    - `/demolitori-aci-ws/rest/agenzia/consulta/documentoVFU/{idVFU}`
    - `/demolitori-aci-ws/rest/agenzia/documentoVFU`
    - `/demolitori-aci-ws/rest/agenzia/fascicolo/{idFascicolo}`
    - `/demolitori-aci-ws/rest/agenzia/VFU/{id}`
    - `/demolitori-aci-ws/rest/agenzia/confermaRadiazioneVFU/VFU/{idVFU}`
    - `/demolitori-aci-ws/rest/agenzia/consulta/VFU`
    - `/demolitori-aci-ws/rest/agenzia/export/VFU`
    - `/demolitori-aci-ws/rest/agenzia/stampa/VFU`
    - `/demolitori-aci-ws/error`
    - `/demolitori-aci-ws/rest/concessionario/consulta/delega`
    - `/demolitori-aci-ws/rest/concessionario/delega/{idDelega}`
    - `/demolitori-aci-ws/rest/concessionario/stampa/delega`
    - `/demolitori-aci-ws/rest/concessionario/consulta/documentoVFU/{idVFU}`
    - `/demolitori-aci-ws/rest/concessionario/documentoVFU`
    - `/demolitori-aci-ws/rest/concessionario/centriRaccoltaConferibili`
    - `/demolitori-aci-ws/rest/concessionario/veicolo`
    - `/demolitori-aci-ws/rest/concessionario/VFU`
    - `/demolitori-aci-ws/rest/concessionario/VFU/{id}`
    - `/demolitori-aci-ws/rest/concessionario/annulla/VFU/{idVFU}`
    - `/demolitori-aci-ws/rest/concessionario/conferisci/VFU/{idVFU}`
    - `/demolitori-aci-ws/rest/concessionario/consulta/VFU`
    - `/demolitori-aci-ws/rest/concessionario/export/VFU`
    - `/demolitori-aci-ws/rest/concessionario/stampa/VFU`
    - `/demolitori-aci-ws/rest/cr/agenziaSTA/sedeOperativa/{codiceAgenzia}`
    - `/demolitori-aci-ws/rest/cr/agenziaSTA/{codiceAgenzia}`
    - `/demolitori-aci-ws/rest/cr/consulta/delega`
    - `/demolitori-aci-ws/rest/cr/delega`
    - `/demolitori-aci-ws/rest/cr/delega/{idDelega}`
    - `/demolitori-aci-ws/rest/cr/revoca/delega/{idDelega}`
    - `/demolitori-aci-ws/rest/cr/stampa/delega`
- **components.schemas**
  - Schemi principali individuati:
    - `AgenziaSta`, `AgenziaStaDTT`
    - `CausaleVfuDto`
    - `ComuneDtt`, `ComuneIstat`
    - `CriteriRicercaDocumento`
    - `Delega`, `DelegaCreate`, `DelegaRevoca`, `DelegaUpdate`
    - `DistintaVFUCreate`, `DistintaVFUUpdate`, `DistintaVfu`
    - `DocumentoVFU`, `DocumentoVFUCreate`, `DocumentoVFUReq`, `DocumentoVFURes`
    - `FascicoloVFU`
    - `OstativiEForzatureVFU`
    - `PageOfDelega`, `PageOfSedeImpresaVfu`, `PageOfSedeImpresaVfuDtt`, `PageOfVFUBean`, `Pageable`
    - `PdfBean`
    - `PostillaCdrCreate`
    - `ProvinciaDtt`, `ProvinciaIstat`
    - `SedeImpresaVfu`

Questa pagina serve come mappa iniziale della spec OpenAPI RVFU; per ogni endpoint e schema andrà poi creata una sezione di dettaglio (request, response, errori) quando implementiamo le API interne del modulo demolizioni.





