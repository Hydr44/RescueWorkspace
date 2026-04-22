
1. Ricerca veicolo

GET https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=D&targa=VA189AJ&tipoVeicolo=A
Authorization: Bearer {id_token}

Response:
{
“esito”: {
“responseStatus”: “OK”,
“code”: “E000”
},
“result”: {
“tipoVeicolo”: “A”,
“targa”: “VA189AJ”,
“telaio”: “ZFA19900005068338”
}
}

⸻

2. Registrazione VFU

POST https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/VFU
Authorization: Bearer {id_token}
Content-Type: application/json

Body:
{
“dataRitiro”: “2026-04-16T00:00:00Z”,
“destinazioneVeicolo”: “A”,
“fabbrica”: “FIAT FIAT 500L”,
“flagConsegnaForzeOrdine”: “N”,
“flagIntestatarioForzato”: “S”,
“flagTipoRegime”: “2”,
“forzaRegistrazione”: “S”,
“intestatario”: {
“codiceFiscale”: “NTSPRM71L20H501B”,
“cognome”: “NESTI”,
“nome”: “PRIMO”
},
“obbligoIscrizionePRA”: “S”,
“targa”: “VA189AJ”,
“telaio”: “ZFA19900005068338”,
“tipoUtilizzoVeicolo”: “0”,
“tipoVeicolo”: “A”,
“causale”: “D”
}

Response:
{
“esito”: {
“responseStatus”: “OK”,
“code”: “E000”
},
“result”: {
“idVFU”: 116007,
“targa”: “VA189AJ”,
“statoVFU”: “PRESO IN CARICO”,
“dataPresaInCarico”: null
}
}



