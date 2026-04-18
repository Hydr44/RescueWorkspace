Ciao Massimiliano,

abbiamo provato subito con AG004557 e AG004559 come indicato. Il 1026 persiste su entrambe.

Test eseguiti il 18/04/2026 ore 08:33 CEST

---

1. Stato attuale VFU #116002 (AG004557):

GET https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/VFU/116002

Risultato:
  statoVFU: "PRESO IN CARICO"
  dataPresaInCarico: null
  idCertificato: null
  idRicevuta: null
  fascicolo: listaDocumenti = [] (vuoto, nessun CDR presente)

---

2. Genera certificato rottamazione (VFU #116002, AG004557):

Request:
POST https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/genera/certificatoRottamazione/116002
Authorization: Bearer {id_token}
Content-Type: application/json

{}

Response:
{
  "result": null,
  "esito": {
    "responseStatus": "KO",
    "message": "SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI",
    "code": "1026"
  }
}

---

3. Genera certificato rottamazione (VFU #116006, AG004559):

Request:
POST https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/genera/certificatoRottamazione/116006
Authorization: Bearer {id_token}
Content-Type: application/json

{}

Response:
{
  "result": null,
  "esito": {
    "responseStatus": "KO",
    "message": "SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI",
    "code": "1026"
  }
}

---

4. Genera ricevuta presa in carico (VFU #116002, AG004557):

Request:
POST https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/genera/ricevutaPresaInCarico/116002
Authorization: Bearer {id_token}
Content-Type: application/json

{}

Response:
{
  "result": null,
  "esito": {
    "responseStatus": "KO",
    "message": "SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI",
    "code": "1026"
  }
}

---

Il CDR non risulta emesso su nessuna delle due targhe (fascicolo vuoto, idCertificato null).
Il 1026 persiste sia su genera CDR che su genera ricevuta.

Grazie,
Rescue Manager S.R.L.
