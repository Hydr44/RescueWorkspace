Ciao Massimiliano,

grazie per la conferma. Il 1026 persiste anche oggi su tutte le targhe. Di seguito le chiamate esatte.

---

Genera certificato rottamazione (VFU #116007, VA189AJ)

Request:
POST https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/genera/certificatoRottamazione/116007
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

Genera certificato rottamazione (VFU #116012, VA100AJ — registrato oggi)

Request:
POST https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/genera/certificatoRottamazione/116012
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

Stesso errore 1026 su tutti i VFU, sia registrati ieri che oggi.
Rimaniamo in attesa di conferma quando i Servizi Firma sono ripristinati.

Grazie,
Rescue Manager S.R.L.
