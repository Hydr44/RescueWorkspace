Ciao Massimiliano,

grazie per aver risolto il problema dei Servizi Firma. Abbiamo ritestato oggi e la generazione del CDR e della ricevuta ora funziona correttamente:

POST /cr/genera/certificatoRottamazione/116002 → E000 OK
POST /cr/genera/ricevutaPresaInCarico/116002 → E000 OK
POST /cr/genera/certificatoRottamazione/116006 → E000 OK
POST /cr/genera/ricevutaPresaInCarico/116006 → E000 OK

dataPresaInCarico ora viene valorizzata correttamente. Abbiamo anche completato il workflow fino a "DA RADIARE" con successo (verifica, chiudi fascicolo, ecc.).

---

Abbiamo però un problema con il download del documento PDF del CDR firmato.

Dopo la generazione, il documento risulta nei metadati con stato FIRMATO, ma il campo "file" è sempre null e non riusciamo a scaricarlo.

1. Metadati documento (presenti):

Request:
GET https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/consulta/documentoVFU/116002

Response (estratto):
{
  "file": null,
  "ext": null,
  "fileName": null,
  "tipoDocumentoEnum": "CERTIFICATO_ROTTAMAZIONE",
  "statoDocumentoEnum": "FIRMATO",
  "idAciDocumento": 2152,
  "codiceDocumento": "20260420CD000001342000437"
}

Il file è null nonostante lo stato sia FIRMATO.

2. Tentativo download per idAci:

Request:
GET https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/documentoVFU?idAci=2152

Response:
{
  "result": null,
  "esito": {
    "responseStatus": "KO",
    "message": "IL DOCUMENTO NON È PRESENTE",
    "code": "1015"
  }
}

3. Tentativo download per fascicolo + progressivo:

Request:
GET https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/documentoVFU?idFascicolo=116002&progressivoDocumento=0

Response:
HTTP 500 — org.apache.camel.http.common.HttpOperationFailedException

Stesso risultato per tutti i documenti (CDR e ricevuta) su tutti i VFU testati (116002, 116006, 116011).

Qual è l'endpoint corretto per scaricare il PDF firmato del CDR e della ricevuta presa in carico?

Grazie,
Rescue Manager S.R.L.
