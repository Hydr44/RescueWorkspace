Casi di test e dettaglio parametri WS ACI (CR)


Il seguente documento illustra degli esempi di chiamate API agli endpoint dei WS ACI relativi al Centro di Raccolta. In particolare per ogni endpoint un esempio di Request completa di dati di test e Response ad integrazione della "Documentazione WS ACI".
Vengono specificati nel dettaglio anche i parametri/oggetti nelle Request, in particolare la lunghezza dei campi di tipo string e i valori ammissibili.


Agenzia (CR)
GET /rvfu/sh/cr/agenziaSTA/{codiceAgenzia} (Ritorna il dettaglio di un'agenzia STA)
Request: /rvfu/sh/cr/agenziaSTA/AG2096
Response:
{
    "result": {
        "codiceAgenzia": "AG2096",
        "denominazione": "ANGILERI FRANCESCO",
        "provinciaSede": "AGRIGENTO",
        "email": "ANGILERIFRANCESCO@LIBERO.IT"
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
 
Delega (CR)
GET /rvfu/sh/cr/consulta/delega (Ritorna la lista paginata delle deleghe emesse)
Request:
https://c-api.servizipdt.it/demolitori-aci-ws/rest/cr/consulta/delega?size=10&page=0

Response:
{
    "result": {
        "content": [
            {
                "centroRaccolta": {
                    "tipoImpresaGestioneVFU": "Centro Raccolta",
                    "codiceFiscale": "02018850061",
                    "matricolaSede": "TODE0001",
                    "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
                    "comuneResidenza": "BITRITTO",
                    "provinciaResidenza": "BARI",
                    "tipoSocieta": "SRL",
                    "toponimoResidenza": "",
                    "indirizzoResidenza": "STRADA STATALE 271 KM.8,680",
                    "civicoResidenza": "",
                    "indirizzoSede": " STRADA STATALE 271 KM.8,680 "
                },
                "concessionario": {
                    "tipoImpresaGestioneVFU": "Concessionario",
                    "codiceFiscale": "02136780984",
                    "matricolaSede": "MICN0001",
                    "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
                    "comuneResidenza": "CERNUSCO SUL NAVIGLIO",
                    "provinciaResidenza": "MILANO",
                    "tipoSocieta": "SRL",
                    "toponimoResidenza": "",
                    "indirizzoResidenza": "VIA ACHILLE GRANDI",
                    "civicoResidenza": "4",
                    "indirizzoSede": " VIA ACHILLE GRANDI 4"
                },
                "idDelega": 2201,
                "dataInizio": "2024-03-05T00:00:00",
                "dataFine": "2024-03-30T23:59:59",
                "motivoRevoca": null,
                "dataRevoca": null,
                "matricolaInserimento": "DETO000101",
                "matricolaAggiornamento": null,
                "dataInserimento": "2024-03-05T17:00:40",
                "noteAggiuntive": "note delega",
                "dataNotificaInserimento": "2024-03-05T17:00:41",
                "dataNotificaRevoca": null,
                "dataUltimoAggiornamento": "2024-03-05T17:00:40",
                "statoDelega": "ATTIVA"
            }
        ],
        "pageable": {
            "sort": {
                "sorted": false,
                "unsorted": true,
                "empty": true
            },
            "offset": 0,
            "pageNumber": 0,
            "pageSize": 10,
            "paged": true,
            "unpaged": false
        },
        "totalElements": 1,
        "last": true,
        "totalPages": 1,
        "size": 10,
        "number": 0,
        "sort": {
            "sorted": false,
            "unsorted": true,
            "empty": true
        },
        "first": true,
        "numberOfElements": 1,
        "empty": false
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}


POST /rvfu/sh/cr/delega (Permette l'inserimento di una nuova delega)
Request:
https://c-api.servizipdt.it/demolitori-aci-ws/rest/cr/delega/
{
     codiceFiscaleDelegato: "02136780984"
      dataFine: "2024-03-21T23:59:59Z"
      dataInizio: "2024-03-02T00:00:00Z"
      idUtenteMotorizzazioneAggiornamento: 0
      idUtenteMotorizzazioneInserimento: 0
      matricolaSedeDelegato: "RMCN0003"
      noteAggiuntive: "note 2"
}

Response:
{
    "result": {
        "centroRaccolta": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "matricolaSede": "TODE0001",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "comuneResidenza": "BITRITTO",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL",
            "toponimoResidenza": "",
            "indirizzoResidenza": "STRADA STATALE 271 KM.8,680",
            "civicoResidenza": "",
            "indirizzoSede": " STRADA STATALE 271 KM.8,680 "
        },
        "concessionario": {
            "tipoImpresaGestioneVFU": "Concessionario",
            "codiceFiscale": "02136780984",
            "matricolaSede": "RMCN0003",
            "denominazioneSociale": "POLICELLA S.R.L. VIA GIUSEPPE CARACI 35",
            "comuneResidenza": "ROMA",
            "provinciaResidenza": "ROMA",
            "tipoSocieta": "SRL",
            "toponimoResidenza": "",
            "indirizzoResidenza": "VIA GIUSEPPE CARACI",
            "civicoResidenza": "35",
            "indirizzoSede": " VIA GIUSEPPE CARACI 35"
        },
        "idDelega": 2301,
        "dataInizio": "2024-03-02T00:00:00",
        "dataFine": "2024-03-21T23:59:59",
        "motivoRevoca": null,
        "dataRevoca": null,
        "matricolaInserimento": "DETO000101",
        "matricolaAggiornamento": null,
        "dataInserimento": "2024-03-07T11:42:52",
        "noteAggiuntive": "note 2",
        "dataNotificaInserimento": "2024-03-07T11:42:52",
        "dataNotificaRevoca": null,
        "dataUltimoAggiornamento": "2024-03-07T11:42:52",
        "statoDelega": "ATTIVA"
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}

Lunghezza campi string nella Request (dei campi obbligatori e facoltativi):
    codiceFiscaleDelegato (min=1, max=16)
matricolaSedeDelegato (min=8, max=8)
    noteAggiuntive (max=600)

Campi obbligatori:
codiceFiscaleDelegato
matricolaSedeDelegato
dataInizio
dataFine
noteAggiuntive

GET /rvfu/sh/cr/delega/{idDelega} (Ritorna il dettaglio di una delega)
Request:
https://c-api.servizipdt.it/demolitori-aci-ws/rest/cr/delega/2201

Response:
{
    "result": {
        "centroRaccolta": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "matricolaSede": "TODE0001",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "comuneResidenza": "BITRITTO",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL",
            "toponimoResidenza": "",
            "indirizzoResidenza": "STRADA STATALE 271 KM.8,680",
            "civicoResidenza": "",
            "indirizzoSede": " STRADA STATALE 271 KM.8,680 "
        },
        "concessionario": {
            "tipoImpresaGestioneVFU": "Concessionario",
            "codiceFiscale": "02136780984",
            "matricolaSede": "MICN0001",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "comuneResidenza": "CERNUSCO SUL NAVIGLIO",
            "provinciaResidenza": "MILANO",
            "tipoSocieta": "SRL",
            "toponimoResidenza": "",
            "indirizzoResidenza": "VIA ACHILLE GRANDI",
            "civicoResidenza": "4",
            "indirizzoSede": " VIA ACHILLE GRANDI 4"
        },
        "idDelega": 2201,
        "dataInizio": "2024-03-05T00:00:00",
        "dataFine": "2024-03-30T23:59:59",
        "motivoRevoca": null,
        "dataRevoca": null,
        "matricolaInserimento": "DETO000101",
        "matricolaAggiornamento": null,
        "dataInserimento": "2024-03-05T17:00:40",
        "noteAggiuntive": "note delega",
        "dataNotificaInserimento": "2024-03-05T17:00:41",
        "dataNotificaRevoca": null,
        "dataUltimoAggiornamento": "2024-03-05T17:00:40",
        "statoDelega": "ATTIVA"
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}


PUT /rvfu/sh/cr/delega/{idDelega} (Permette l'aggiornamento di una delega)
Request: /rvfu/sh/cr/delega/1001
{
    centroRaccolta: {
    codiceFiscale: "02018850061"
    denominazioneSociale: "ENTERPRISE SERVICES ITALIA S.R.L."
    provinciaResidenza: "BARI"
    tipoImpresaGestioneVFU: "Centro Raccolta"
    tipoSocieta: "SRL"
}
    concessionario: {
    codiceFiscale: "00469010581"
    denominazioneSociale: "Concessionario Rossi"
    provinciaResidenza: "MILANO"
    tipoImpresaGestioneVFU: "Concessionario"
    tipoSocieta: "SRL"
}
    dataFine: "2024-02-07T23:59:59Z"
    dataInizio: "2024-01-12T00:00:00Z"
    dataInserimento: "2024-01-26T23:59:59Z"
    dataNotificaInserimento: "2024-01-26T23:59:59Z"
    dataNotificaRevoca: null
    dataRevoca: null
    dataUltimoAggiornamento: "2024-01-26T23:59:59Z"
    idDelega: 1001
    matricolaAggiornamento: null
    matricolaInserimento: "DETO000101"
    motivoRevoca: null
    noteAggiuntive: "nuova delega del 26/01"
    statoDelega: "ATTIVA"
}
Response:
{
    "result": {
        "centroRaccolta": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL"
        },
        "concessionario": {
            "tipoImpresaGestioneVFU": "Concessionario",
            "codiceFiscale": "00469010581",
            "denominazioneSociale": "Concessionario Rossi",
            "provinciaResidenza": "MILANO",
            "tipoSocieta": "SRL"
        },
        "idDelega": 1001,
        "dataInizio": "2024-01-12T00:00:00",
        "dataFine": "2024-02-07T23:59:59",
        "motivoRevoca": null,
        "dataRevoca": null,
        "matricolaInserimento": "DETO000101",
        "matricolaAggiornamento": "DETO000101",
        "dataInserimento": "2024-01-26T12:16:43",
        "noteAggiuntive": "nuova delega del 26/01",
        "dataNotificaInserimento": "2024-01-26T12:16:43",
        "dataNotificaRevoca": null,
        "dataUltimoAggiornamento": "2024-01-26T12:20:50",
        "statoDelega": "ATTIVA"
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}

Lunghezza campi string nella Request:
    noteAggiuntive (min=1, max=600)

Campi obbligatori:

Valori ammissibili:

 

DELETE /rvfu/sh/cr/delega/{idDelega} (Permette l'annullamento di una delega)
Request: /rvfu/sh/cr/delega/1001
Response:
{
    "result": null,
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
PUT /rvfu/sh/cr/revoca/delega/{idDelega} (Permette la revoca di una delega)
Request: /rvfu/sh/cr/revoca/delega/1002
{
    dataRevoca: "2024-01-26T23:59:59Z"
    motivoRevoca: "revoca 1"
}
Response:
{
    "result": {
        "centroRaccolta": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL"
        },
        "concessionario": {
            "tipoImpresaGestioneVFU": "Concessionario",
            "codiceFiscale": "00469010581",
            "denominazioneSociale": "Concessionario Rossi",
            "provinciaResidenza": "MILANO",
            "tipoSocieta": "SRL"
        },
        "idDelega": 1002,
        "dataInizio": "2024-01-05T00:00:00",
        "dataFine": "2024-02-15T23:59:59",
        "motivoRevoca": "revoca 1",
        "dataRevoca": "2024-01-26T23:59:59",
        "matricolaInserimento": "DETO000101",
        "matricolaAggiornamento": "DETO000101",
        "dataInserimento": "2024-01-26T14:22:14",
        "noteAggiuntive": "delega del 26_01 (2)",
        "dataNotificaInserimento": "2024-01-26T14:22:14",
        "dataNotificaRevoca": "2024-01-26T14:23:22",
        "dataUltimoAggiornamento": "2024-01-26T14:23:22",
        "statoDelega": "REVOCATA"
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}

Lunghezza campi string nella Request:
motivoRevoca (min=1, max=600)
Campi obbligatori:
motivoRevoca
dataRevoca
Valori ammissibili:
 

GET /rvfu/sh/cr/stampa/delega (Ritorna il pdf della lista paginata delle deleghe emesse)
Request: /rvfu/sh/cr/stampa/delega?size=10&page=0
Response:
{
    "result": {
        "pdf": "JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PC9GaWx....VmCjExOTk0CiUlRU9GCg=="
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
Fascicolo (CR)
POST /rvfu/sh/cr/allega/documentoVFU/{idVFU} (Permette di allegare un documento VFU)
Request: /rvfu/sh/cr/allega/documentoVFU/36001
{
    dataEmissioneDocumento: "2023-11-03T00:00:00Z"
    dataScadenzaDocumento: "2024-03-30T23:59:59Z"
    enteEmissioneDocumento: "Ente 1"
    file: "JVBERi0xLjcKCjQgMCBvYmoKKElkZW50…aXR5KQplbmRvYmoKN"
    noteAggiuntive: "Note 1"
    tipoDocumento: "I"
}
Response:
{
    "result": {
        "tipoDocumento": "Altro",
        "categoriaDocumento": "P",
        "idFascicolo": 35001,
        "progressivoDocumento": 3,
        "codiceDocumento": "N/A",
        "statoDocumento": "Inserito",
        "idCartella": 6822,
        "idAciDocumento": 6825,
        "dataEmissioneDocumento": "2023-11-03T00:00:00",
        "dataRilascioDocumento": null,
        "enteEmissioneDocumento": "ENTE 1",
        "dataInserimento": "2024-01-29T14:51:33",
        "matricolaInserimento": "DETO000101",
        "dataScadenzaDocumento": "2024-03-30T23:59:59",
        "dataAnnullamentoDocumento": null,
        "matricolaAnnullamento": null,
        "matricolaAggiornamento": null,
        "idSoggettoVFU": null,
        "noteAggiuntive": "Note 1",
        "badgeUltimoAggiornamento": null,
        "dataUltimoAggiornamento": "2024-01-29T14:51:33",
        "tipoDocumentoDU": null,
        "file": null,
        "ext": null,
        "fileName": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}

Lunghezza campi string nella Request:
enteEmissioneDocumento (min=1, max=120)
noteAggiuntive (min=1, max=600)
tipoDocumento (min=1, max=1)

Campi obbligatori:
tipoDocumento,
dataEmissioneDocumento,
file

Valori ammissibili:
tipoDocumento:   {"Documento di identità intestatario" , "I"},
                                {"Denuncia" ,  'D'},
                                {"Certificato di proprieta'" ,  'P'},
                                {"Carta di Circolazione" , 'Z'},
                                {"Foglio complementare" ,  'F'},
                                { "Verbale di consegna" , 'V'},
                                {"Documento Unico" , 'U'},
                                {"Documento di identità detentore" , 'M'},
                                {"Altro" , 'L'}


PUT /rvfu/sh/cr/chiudi/fascicolo/{idVFU} (Permette la chiusura di un fascicolo)
Request: /rvfu/sh/cr/chiudi/fascicolo/36001
{
}
Response:
{
    "result": {
        "idFascicolo": 35001,
        "idVFU": 36001,
        "matricolaInserimento": "DETO000101",
        "dataCreazioneFascicolo": "2024-01-26T09:43:00",
        "dataChiusuraFascicolo": null,
        "badgeUtenteAggiornamento": null,
        "dataUltimoAggiornamento": "2024-01-29T14:36:27",
        "statoFascicoloVFU": "Chiuso",
        "listaDocumenti": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
GET /rvfu/sh/cr/consulta/documentoVFU/{idVFU} (Ritorna la lista delle informazioni dei documenti del veicolo fuori uso)
Request: /rvfu/sh/cr/consulta/documentoVFU/29001
Response:
{
    "result": [
        {
            "tipoDocumento": "Certificato di rottamazione",
            "categoriaDocumento": "V",
            "idFascicolo": 28001,
            "progressivoDocumento": 1,
            "codiceDocumento": "20231218CD000000010000040",
            "statoDocumento": "Firmato",
            "idCartella": null,
            "idAciDocumento": 163,
            "dataEmissioneDocumento": "2023-12-18T10:40:38",
            "dataRilascioDocumento": "2023-12-18T10:40:38",
            "enteEmissioneDocumento": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "dataInserimento": "2023-12-18T10:40:38",
            "matricolaInserimento": "DETO000101",
            "dataScadenzaDocumento": null,
            "dataAnnullamentoDocumento": null,
            "matricolaAnnullamento": null,
            "matricolaAggiornamento": null,
            "idSoggettoVFU": null,
            "noteAggiuntive": null,
            "badgeUltimoAggiornamento": null,
            "dataUltimoAggiornamento": "2023-12-18T10:40:38",
            "tipoDocumentoDU": 9,
            "file": null,
            "ext": null,
            "fileName": null
        },
        {
            "tipoDocumento": "Foglio complementare",
            "categoriaDocumento": "V",
            "idFascicolo": 28001,
            "progressivoDocumento": 3,
            "codiceDocumento": "N/A",
            "statoDocumento": "Firmato",
            "idCartella": 6171,
            "idAciDocumento": 6174,
            "dataEmissioneDocumento": "2023-12-18T00:00:00",
            "dataRilascioDocumento": null,
            "enteEmissioneDocumento": "MOT",
            "dataInserimento": "2023-12-18T10:45:02",
            "matricolaInserimento": "DETO000101",
            "dataScadenzaDocumento": "2023-12-31T23:59:59",
            "dataAnnullamentoDocumento": null,
            "matricolaAnnullamento": null,
            "matricolaAggiornamento": "DETO000101",
            "idSoggettoVFU": null,
            "noteAggiuntive": "not",
            "badgeUltimoAggiornamento": null,
            "dataUltimoAggiornamento": "2023-12-18T10:45:08",
            "tipoDocumentoDU": null,
            "file": null,
            "ext": null,
            "fileName": null
        },
        {
            "tipoDocumento": "Certificato di proprietà",
            "categoriaDocumento": "V",
            "idFascicolo": 28001,
            "progressivoDocumento": 4,
            "codiceDocumento": "N/A",
            "statoDocumento": "Firmato",
            "idCartella": 6220,
            "idAciDocumento": 6223,
            "dataEmissioneDocumento": "2023-12-19T00:00:00",
            "dataRilascioDocumento": null,
            "enteEmissioneDocumento": "EM",
            "dataInserimento": "2023-12-19T10:07:26",
            "matricolaInserimento": "DETO000101",
            "dataScadenzaDocumento": "2023-12-23T23:59:59",
            "dataAnnullamentoDocumento": null,
            "matricolaAnnullamento": null,
            "matricolaAggiornamento": "DETO000101",
            "idSoggettoVFU": null,
            "noteAggiuntive": null,
            "badgeUltimoAggiornamento": null,
            "dataUltimoAggiornamento": "2023-12-19T10:07:31",
            "tipoDocumentoDU": 1,
            "file": null,
            "ext": null,
            "fileName": null
        },
        {
            "tipoDocumento": "Ricevuta presa in carico",
            "categoriaDocumento": "V",
            "idFascicolo": 28001,
            "progressivoDocumento": 0,
            "codiceDocumento": "20231218RD000000009000040",
            "statoDocumento": "Firmato",
            "idCartella": null,
            "idAciDocumento": 162,
            "dataEmissioneDocumento": "2023-12-18T10:40:31",
            "dataRilascioDocumento": "2023-12-18T10:40:31",
            "enteEmissioneDocumento": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "dataInserimento": "2023-12-18T10:40:31",
            "matricolaInserimento": "DETO000101",
            "dataScadenzaDocumento": null,
            "dataAnnullamentoDocumento": null,
            "matricolaAnnullamento": null,
            "matricolaAggiornamento": null,
            "idSoggettoVFU": null,
            "noteAggiuntive": null,
            "badgeUltimoAggiornamento": null,
            "dataUltimoAggiornamento": "2023-12-18T10:40:31",
            "tipoDocumentoDU": null,
            "file": null,
            "ext": null,
            "fileName": null
        },
        {
            "tipoDocumento": "Verbale di consegna",
            "categoriaDocumento": "P",
            "idFascicolo": 28001,
            "progressivoDocumento": 2,
            "codiceDocumento": "N/A",
            "statoDocumento": "Firmato",
            "idCartella": 6157,
            "idAciDocumento": 6160,
            "dataEmissioneDocumento": "2023-12-18T00:00:00",
            "dataRilascioDocumento": null,
            "enteEmissioneDocumento": "CR",
            "dataInserimento": "2023-12-18T10:43:47",
            "matricolaInserimento": "DETO000101",
            "dataScadenzaDocumento": "2023-12-31T23:59:59",
            "dataAnnullamentoDocumento": null,
            "matricolaAnnullamento": null,
            "matricolaAggiornamento": "DETO000101",
            "idSoggettoVFU": null,
            "noteAggiuntive": null,
            "badgeUltimoAggiornamento": null,
            "dataUltimoAggiornamento": "2023-12-18T10:43:56",
            "tipoDocumentoDU": null,
            "file": null,
            "ext": null,
            "fileName": null
        }
    ],
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
GET /rvfu/sh/cr/documentoVFU?idAci=163&idFascicolo=28001&progressivoDocumento=1(Permette di scaricare un documento di un veicolo fuori uso)
Request: /rvfu/sh/cr/documentoVFU?idAci=1&idFascicolo=2&progressivoDocumento=3
Response:
{
    "result": {
        "tipoDocumento": "Certificato di rottamazione",
        "categoriaDocumento": "V",
        "idFascicolo": 28001,
        "progressivoDocumento": 1,
        "codiceDocumento": "20231218CD000000010000040",
        "statoDocumento": "Firmato",
        "idCartella": null,
        "idAciDocumento": 163,
        "dataEmissioneDocumento": "2023-12-18T10:40:38",
        "dataRilascioDocumento": "2023-12-18T10:40:38",
        "enteEmissioneDocumento": "ENTERPRISE SERVICES ITALIA S.R.L.",
        "dataInserimento": "2023-12-18T10:40:38",
        "matricolaInserimento": "DETO000101",
        "dataScadenzaDocumento": null,
        "dataAnnullamentoDocumento": null,
        "matricolaAnnullamento": null,
        "matricolaAggiornamento": null,
        "idSoggettoVFU": null,
        "noteAggiuntive": null,
        "badgeUltimoAggiornamento": null,
        "dataUltimoAggiornamento": "2023-12-18T10:40:38",
        "tipoDocumentoDU": 9,
        "file": "JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PC9GaW...IwNjAxMDVmCjM5NjkxCiUlRU9GCg==",
        "ext": ".pdf",
        "fileName": "Certificato di rottamazione.pdf"
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
PUT /rvfu/sh/cr/documentoVFU (Permette di sostituire un documento di un veicolo fuori uso)
Request: /rvfu/sh/cr/documentoVFU
{
file: "JVBERi0…",
idAciDocumento = 1
idFascicolo = 2
progressivoDocumento = 3
}
Response:
{
    "result": null,
    "esito": {
        "responseStatus": "KO",
        "message": "SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI",
        "code": "1026"
    }
}
POST /rvfu/sh/cr/documentoVFU (Permette di eliminare un documento di un veicolo fuori uso)
Request: /rvfu/sh/cr/documentoVFU
{
idAci = 6825
idFascicolo = 35001
progressivoDocumento = 3
}

Response:
{
    "result": {
        "tipoDocumento": "Altro",
        "categoriaDocumento": "P",
        "idFascicolo": 35001,
        "progressivoDocumento": 3,
        "codiceDocumento": "N/A",
        "statoDocumento": "Eliminato",
        "idCartella": 6822,
        "idAciDocumento": 6825,
        "dataEmissioneDocumento": "2023-11-03T00:00:00",
        "dataRilascioDocumento": null,
        "enteEmissioneDocumento": "ENTE 1",
        "dataInserimento": "2024-01-29T14:51:33",
        "matricolaInserimento": "DETO000101",
        "dataScadenzaDocumento": "2024-03-30T23:59:59",
        "dataAnnullamentoDocumento": "2024-01-29T15:53:26",
        "matricolaAnnullamento": "DETO000101",
        "matricolaAggiornamento": null,
        "idSoggettoVFU": null,
        "noteAggiuntive": "Note 1",
        "badgeUltimoAggiornamento": null,
        "dataUltimoAggiornamento": "2024-01-29T15:53:26",
        "tipoDocumentoDU": null,
        "file": null,
        "ext": null,
        "fileName": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
POST /rvfu/sh/cr/genera/certificatoRottamazione/{idVFU} (Permette di generare il certificato di rottamazione del veicolo fuori uso)
Request: /rvfu/sh/cr/genera/certificatoRottamazione/44004
{
    causale: null
    cic: null
    dataImmatricolazione: "1997-03-26T00:00:00"
    dataRegistrazione: "2024-02-06T16:36:37"
    destinazioneVeicolo: null
    enteConferimento: "ENTERPRISE SERVICES ITALIA S.R.L."
    enteRitiro: "ENTERPRISE SERVICES ITALIA S.R.L."
    modello: "VENEZIA VE 50 P "
    obbligoIscrizionePRA: "N"
    ostativiEForzature: null
    radiabile: "SI"
    regimeVeicolo: "1"
    soggettoVeicolo: {
    badgeUtenteAggiornamento: null
    capResidenza: "00100"
    codiceFiscale: "MRORSI98A12H501L"
    cognome: "ROSSI"
    comuneNascita: null
    comuneResidenza: {
    codice: "091"
    denominazione: "ROMA"
}
    dataInserimento: "2024-02-06T16:36:37"
    dataNascita: "1998-01-12T00:00:00"
    dataUltimoAggiornamento: "2024-02-06T16:36:37"
    idSoggetto: 43004
    idVFU: 44004
    indirizzoResidenza: "VIA PADOVA, 22"
    localitaEsteraNascita: null
    localitaEsteraResidenza: null
    matricolaAggiornamento: null
    matricolaInserimento: "DETO000101"
    nome: "MARIO"
    numeroCivicoResidenza: null
    provinciaNascita: null
    provinciaResidenza: {
    codice: "058"
    denominazione: "ROMA"
    sigla: "RM"
}
    ragioneSociale: null
    statoEsteroNascita: null
    statoEsteroResidenza: null
    tipoPersonaGiuridica: null
    tipoSoggetto: "Intestatario inserito manualmente"
    toponimoResidenza: null
}
    statoVFU: "PRESO IN CARICO"
    targa: "AG004563"
    telaio: "0049"
    tipoUtilizzoVeicolo: null
    tipoVeicolo: "T"
    vincoloOstativo: "NO"
}
Response:
{
    "result": {
        "tipoDocumento": "Certificato di rottamazione",
        "categoriaDocumento": "V",
        "idFascicolo": 43004,
        "progressivoDocumento": 0,
        "codiceDocumento": "20240206CD000000065000040",
        "statoDocumento": "Firmato",
        "idCartella": null,
        "idAciDocumento": 198,
        "dataEmissioneDocumento": "2024-02-06T17:06:23",
        "dataRilascioDocumento": "2024-02-06T17:06:23",
        "enteEmissioneDocumento": "ENTERPRISE SERVICES ITALIA S.R.L.",
        "dataInserimento": "2024-02-06T17:06:23",
        "matricolaInserimento": "DETO000101",
        "dataScadenzaDocumento": null,
        "dataAnnullamentoDocumento": null,
        "matricolaAnnullamento": null,
        "matricolaAggiornamento": null,
        "idSoggettoVFU": null,
        "noteAggiuntive": null,
        "badgeUltimoAggiornamento": null,
        "dataUltimoAggiornamento": "2024-02-06T17:06:23",
        "tipoDocumentoDU": 9,
        "file": null,
        "ext": null,
        "fileName": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
Campi obbligatori:
idVfu da valorizzare nella url come nella request di esempio

Note:
La request viene valorizzata dai dati del veicolo, ottenuti chiamando il servizio /rvfu/sh/cr/veicolo?tipoVeicolo=A&targa=VA311AA&codiceFiscale=VTIMRC64H23H501F&causale=D


POST /rvfu/sh/cr/genera/ricevutaPresaInCarico/{idVFU} (Permette di generare la ricevuta di presa in carico del veicolo fuori uso)
Request: /rvfu/sh/cr/genera/ricevutaPresaInCarico/36002
{
}
Response:
{
    "result": {
        "tipoDocumento": "Ricevuta presa in carico",
        "categoriaDocumento": "V",
        "idFascicolo": 35002,
        "progressivoDocumento": 1,
        "codiceDocumento": "20240129RD000000035000040",
        "statoDocumento": "Firmato",
        "idCartella": null,
        "idAciDocumento": 179,
        "dataEmissioneDocumento": "2024-01-29T16:10:49",
        "dataRilascioDocumento": "2024-01-29T16:10:49",
        "enteEmissioneDocumento": "ENTERPRISE SERVICES ITALIA S.R.L.",
        "dataInserimento": "2024-01-29T16:10:49",
        "matricolaInserimento": "DETO000101",
        "dataScadenzaDocumento": null,
        "dataAnnullamentoDocumento": null,
        "matricolaAnnullamento": null,
        "matricolaAggiornamento": null,
        "idSoggettoVFU": null,
        "noteAggiuntive": null,
        "badgeUltimoAggiornamento": null,
        "dataUltimoAggiornamento": "2024-01-29T16:10:49",
        "tipoDocumentoDU": null,
        "file": null,
        "ext": null,
        "fileName": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
PUT /rvfu/sh/cr/inviaAlTablet/{idFascicolo} (Permette di inviare al tablet i documenti allegati)
Request: /rvfu/sh/cr/inviaAlTablet/35001
{
}
Response:
{
    "result": null,
    "esito": {
        "responseStatus": "KO",
        "message": "ERRORE CAMBIAMENTO STATO FASCICOLO",
        "code": "1003"
    }
}

NOTE
Errore se lo stato del facicolo diverso da  “I” (Inserito).
PUT /rvfu/sh/cr/riapri/fascicolo/{idVFU} (Permette la riapertura di un fascicolo)
Request: /rvfu/sh/cr/riapri/fascicolo/30001
{
}
Response:
{
    "result": {
        "idFascicolo": 29001,
        "idVFU": 30001,
        "matricolaInserimento": "CNMI000103",
        "dataCreazioneFascicolo": "2024-01-10T11:28:57",
        "dataChiusuraFascicolo": null,
        "badgeUtenteAggiornamento": null,
        "dataUltimoAggiornamento": "2024-01-31T14:24:45",
        "statoFascicoloVFU": "Inserito",
        "listaDocumenti": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}


PUT /rvfu/sh/cr/inviaAlTablet/{idFascicolo} (Permette di inviare al tablet i documenti allegati)
Request: /rvfu/sh/cr/inviaAlTablet/35001
{
}
Response:
{
    "result": null,
    "esito": {
        "responseStatus": "KO",
        "message": "ERRORE CAMBIAMENTO STATO FASCICOLO",
        "code": "1003"
    }
}

NOTE
Errore se lo stato del facicolo diverso da  “I” (Inserito).
DELETE /rvfu/sh/cr/cartellaFirma/{idCartella} (Permette di annullare e clonare una cartella)
Request: /rvfu/sh/cr/cartellaFirma/1500
{
}
Respons
"result": {
        "idFascicolo": 5005,
        "idVFU": 5005,
        "matricolaInserimento": "DETO000201",
        "dataCreazioneFascicolo": "2024-03-07T10:18:12",
        "dataChiusuraFascicolo": null,
        "badgeUtenteAggiornamento": null,
        "dataUltimoAggiornamento": "2024-03-07T10:18:12",
        "statoFascicoloVFU": null,
        "statoFascicoloEnum": null,
        "listaDocumenti": [
            {
                "file": null,
                "ext": null,
                "fileName": null,
                "tipoDocumento": "Certificato di rottamazione",
                "categoriaDocumento": "V",
                "idFascicolo": 5005,
                "progressivoDocumento": 1,
                "codiceDocumento": "20240307CD000000137000401",
                "statoDocumento": "Firmato",
                "idCartella": null,
                "idAciDocumento": 94,
                "dataEmissioneDocumento": "2024-03-07T10:18:48",
                "dataRilascioDocumento": "2024-03-07T10:18:48",
                "enteEmissioneDocumento": "ECODAT",
                "dataInserimento": "2024-03-07T10:18:48",
                "matricolaInserimento": "DETO000201",
                "dataScadenzaDocumento": null,
                "dataAnnullamentoDocumento": null,
                "matricolaAnnullamento": null,
                "matricolaAggiornamento": null,
                "idSoggettoVFU": null,
                "noteAggiuntive": null,
                "badgeUltimoAggiornamento": null,
                "dataUltimoAggiornamento": "2024-03-07T10:18:48",
                "tipoDocumentoDU": 9,
                "descrizioneCausale": null
            },
            {
                "file": null,
                "ext": null,
                "fileName": null,
                "tipoDocumento": "Procura del detentore",
                "categoriaDocumento": "P",
                "idFascicolo": 5005,
                "progressivoDocumento": 0,
                "codiceDocumento": "N/A",
                "statoDocumento": "Inserito",
                "idCartella": 13731,
                "idAciDocumento": 1503,
                "dataEmissioneDocumento": "2024-01-01T00:00:00",
                "dataRilascioDocumento": null,
                "enteEmissioneDocumento": null,
                "dataInserimento": "2024-03-07T10:18:12",
                "matricolaInserimento": "DETO000201",
                "dataScadenzaDocumento": null,
                "dataAnnullamentoDocumento": null,
                "matricolaAnnullamento": null,
                "matricolaAggiornamento": null,
                "idSoggettoVFU": 5010,
                "noteAggiuntive": null,
                "badgeUltimoAggiornamento": null,
                "dataUltimoAggiornamento": "2024-03-07T10:18:12",
                "tipoDocumentoDU": null,
                "descrizioneCausale": null
            }
        ]
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}

NOTE
Il WS permette l'annullamento di una cartella di firma bloccata nel tablet e la creazione di un nuovo id cartella con gli stessi documenti
L’operazione va effettuata quando la cartella ha i documenti nello stato ‘INVIATO AL TABLET’
Tutti i documenti della cartella, una volta eliminata, vengono rimessi nello stato INSERITO
L'utente avrà quindi la possibilità di eliminare alcuni documenti prima di re-inviare la cartella al tablet per la firma.



Impresa gestione VFU (CR)
GET /rvfu/sh/cr/consulta/centroRaccolta (Ritorna la lista paginata dei CR)
Request:
https://c-api.servizipdt.it/demolitori-aci-ws/rest/cr/consulta/centroRaccolta?size=10&page=0&codiceProvincia=058

Response:
{
    "result": {
        "content": [
            {
                "tipoImpresaGestioneVFU": "Centro Raccolta",
                "codiceFiscale": "12345678903",
                "matricolaSede": "RMAG0003",
                "denominazioneSociale": "PRAV INVIO",
                "comuneResidenza": "ROMA",
                "provinciaResidenza": "ROMA",
                "tipoSocieta": "SRL",
                "toponimoResidenza": "",
                "indirizzoResidenza": "VI TEST",
                "civicoResidenza": "1",
                "indirizzoSede": " VI TEST 1"
            },
            {
                "tipoImpresaGestioneVFU": "Centro Raccolta",
                "codiceFiscale": "12345678904",
                "matricolaSede": "RMAG0004",
                "denominazioneSociale": "PRAV INVIO",
                "comuneResidenza": "ROMA",
                "provinciaResidenza": "ROMA",
                "tipoSocieta": "SRL",
                "toponimoResidenza": "",
                "indirizzoResidenza": "VI TEST",
                "civicoResidenza": "1",
                "indirizzoSede": " VI TEST 1"
            },
            {
                "tipoImpresaGestioneVFU": "Centro Raccolta",
                "codiceFiscale": "12345678905",
                "matricolaSede": "RMAG0005",
                "denominazioneSociale": "PRAV INVIO",
                "comuneResidenza": "ROMA",
                "provinciaResidenza": "ROMA",
                "tipoSocieta": "SRL",
                "toponimoResidenza": "",
                "indirizzoResidenza": "VI TEST",
                "civicoResidenza": "1",
                "indirizzoSede": " VI TEST 1"
            },
            {
                "tipoImpresaGestioneVFU": "Centro Raccolta",
                "codiceFiscale": "12345678906",
                "matricolaSede": "RMAG0006",
                "denominazioneSociale": "PRAV INVIO",
                "comuneResidenza": "ROMA",
                "provinciaResidenza": "ROMA",
                "tipoSocieta": "SRL",
                "toponimoResidenza": "",
                "indirizzoResidenza": "VI TEST",
                "civicoResidenza": "1",
                "indirizzoSede": " VI TEST 1"
            },
            {
                "tipoImpresaGestioneVFU": "Centro Raccolta",
                "codiceFiscale": "12345678907",
                "matricolaSede": "RMAG0007",
                "denominazioneSociale": "PRAV INVIO",
                "comuneResidenza": "ROMA",
                "provinciaResidenza": "ROMA",
                "tipoSocieta": "SRL",
                "toponimoResidenza": "",
                "indirizzoResidenza": "VI TEST",
                "civicoResidenza": "1",
                "indirizzoSede": " VI TEST 1"
            },
            {
                "tipoImpresaGestioneVFU": "Centro Raccolta",
                "codiceFiscale": "12345678908",
                "matricolaSede": "RMAG0012",
                "denominazioneSociale": "PRAV INVIO",
                "comuneResidenza": "ROMA",
                "provinciaResidenza": "ROMA",
                "tipoSocieta": "SRL",
                "toponimoResidenza": "",
                "indirizzoResidenza": "VI TEST",
                "civicoResidenza": "1",
                "indirizzoSede": " VI TEST 1"
            },
            {
                "tipoImpresaGestioneVFU": "Centro Raccolta",
                "codiceFiscale": "12345678909",
                "matricolaSede": "RMAG0010",
                "denominazioneSociale": "PRAV INVIO",
                "comuneResidenza": "ROMA",
                "provinciaResidenza": "ROMA",
                "tipoSocieta": "SRL",
                "toponimoResidenza": "",
                "indirizzoResidenza": "VI TEST",
                "civicoResidenza": "1",
                "indirizzoSede": " VI TEST 1"
            },
            {
                "tipoImpresaGestioneVFU": "Centro Raccolta",
                "codiceFiscale": "12345678900",
                "matricolaSede": "RMDE0001",
                "denominazioneSociale": "TEST DA SWAGGER",
                "comuneResidenza": "ROMA",
                "provinciaResidenza": "ROMA",
                "tipoSocieta": "SRL",
                "toponimoResidenza": "",
                "indirizzoResidenza": "VIA SWAGGER",
                "civicoResidenza": "10",
                "indirizzoSede": " VIA SWAGGER 10"
            },
            {
                "tipoImpresaGestioneVFU": "Centro Raccolta",
                "codiceFiscale": "12345678113",
                "matricolaSede": "RMAG0022",
                "denominazioneSociale": "PRAV INVIO",
                "comuneResidenza": "ROMA",
                "provinciaResidenza": "ROMA",
                "tipoSocieta": "SRL",
                "toponimoResidenza": "",
                "indirizzoResidenza": "VI TEST",
                "civicoResidenza": "1",
                "indirizzoSede": " VI TEST 1"
            },
            {
                "tipoImpresaGestioneVFU": "Centro Raccolta",
                "codiceFiscale": "12345688113",
                "matricolaSede": "RMAG0023",
                "denominazioneSociale": "PRAV INVIO",
                "comuneResidenza": "ROMA",
                "provinciaResidenza": "ROMA",
                "tipoSocieta": "SRL",
                "toponimoResidenza": "",
                "indirizzoResidenza": "VI TEST",
                "civicoResidenza": "1",
                "indirizzoSede": " VI TEST 1"
            }
        ],
        "pageable": {
            "sort": {
                "sorted": false,
                "unsorted": true,
                "empty": true
            },
            "offset": 0,
            "pageNumber": 0,
            "pageSize": 10,
            "paged": true,
            "unpaged": false
        },
        "totalElements": 13,
        "last": false,
        "totalPages": 2,
        "size": 10,
        "number": 0,
        "sort": {
            "sorted": false,
            "unsorted": true,
            "empty": true
        },
        "first": true,
        "numberOfElements": 10,
        "empty": false
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
} 

GET /rvfu/sh/cr/consulta/concessionario (Ritorna il dettaglio del concessionario delegato)
Request:
https://c-api.servizipdt.it/demolitori-aci-ws/rest/cr/consulta/concessionario?codiceFiscale=02136780984&page=0&size=100000

Response:
{
    "result": [
        {
            "tipoImpresaGestioneVFU": "Concessionario",
            "codiceFiscale": "02136780984",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "provinciaResidenza": "MILANO",
            "comuneResidenza": "CERNUSCO SUL NAVIGLIO",
            "toponimoResidenza": "",
            "indirizzoResidenza": "VIA ACHILLE GRANDI",
            "civicoResidenza": "4",
            "indirizzoSede": " VIA ACHILLE GRANDI 4",
            "capResidenza": "20063",
            "statoEsteroResidenza": null,
            "localitaEsteraResidenza": null,
            "indirizzoTelematico": "emanuele.pace@dxc.com",
            "postaCertificata": null,
            "tipoSocieta": "SRL",
            "provinciaSedeOperativa": "MI",
            "tipoSedeOperativa": "CN",
            "idSedeOperativa": "0001",
            "sedeImpresa": "MICN0001"
        },
        {
            "tipoImpresaGestioneVFU": "Concessionario",
            "codiceFiscale": "02136780984",
            "denominazioneSociale": "POLICELLA S.R.L. VIA GIUSEPPE CARACI 35",
            "provinciaResidenza": "ROMA",
            "comuneResidenza": "ROMA",
            "toponimoResidenza": "",
            "indirizzoResidenza": "VIA GIUSEPPE CARACI",
            "civicoResidenza": "35",
            "indirizzoSede": " VIA GIUSEPPE CARACI 35",
            "capResidenza": "00100",
            "statoEsteroResidenza": null,
            "localitaEsteraResidenza": null,
            "indirizzoTelematico": "gabriella.policella@dxc.com",
            "postaCertificata": null,
            "tipoSocieta": "SRL",
            "provinciaSedeOperativa": "RM",
            "tipoSedeOperativa": "CN",
            "idSedeOperativa": "0003",
            "sedeImpresa": "RMCN0003"
        }
    ],
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
} 

Veicolo (CR)
GET /rvfu/sh/cr/veicolo (Ritorna il veicolo ricercato)

ESEMPIO VEICOLO PRA (tipoVeicolo = A)

Request: /rvfu/sh/cr/veicolo?tipoVeicolo=A&targa=VA311AA&codiceFiscale=VTIMRC64H23H501F&causale=D
Response:
{
    "result": {
        "targa": "VA311AA ",
        "telaio": "WDB2037081A565940",
        "tipoVeicolo": "A",
        "modello": "DAIMLERCHRYSLER AGMB203CL R80CF0TCABA401 ",
        "dataImmatricolazione": "2023-10-13T00:00:00",
        "obbligoIscrizionePRA": "S",
        "radiabile": "SI",
        "ostativiEForzature": null,
        "vincoloOstativo": "NO",
        "soggettoVeicolo": {
            "idSoggetto": 29001,
            "idVFU": 30001,
            "tipoSoggetto": "Intestatario",
            "nome": "MARCO",
            "cognome": "VITA",
            "codiceFiscale": "VTIMRC64H23H501F",
            "dataNascita": "1964-06-23T00:00:00",
            "provinciaNascita": null,
            "comuneNascita": null,
            "statoEsteroNascita": null,
            "localitaEsteraNascita": null,
            "provinciaResidenza": null,
            "comuneResidenza": null,
            "toponimoResidenza": null,
            "indirizzoResidenza": "VIA ADDA 2",
            "numeroCivicoResidenza": null,
            "capResidenza": null,
            "statoEsteroResidenza": null,
            "localitaEsteraResidenza": null,
            "tipoPersonaGiuridica": null,
            "ragioneSociale": null,
            "dataInserimento": "2024-01-10T11:28:57",
            "matricolaInserimento": "CNMI000103",
            "matricolaAggiornamento": null,
            "badgeUtenteAggiornamento": null,
            "dataUltimoAggiornamento": "2024-01-10T11:28:57"
        },
        "tipoUtilizzoVeicolo": "0",
        "destinazioneVeicolo": "A",
        "regimeVeicolo": "2",
        "dataRegistrazione": "2024-01-10T11:28:57",
        "statoVFU": "INVIATO A STA",
        "enteRitiro": "ENTERPRISE SERVICES ITALIA S.R.L.",
        "enteConferimento": "ENTERPRISE SERVICES ITALIA S.R.L.",
        "causale": null,
        "cic": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
 
ESEMPIO VEICOLO NON PRA (tipoVeicolo diverso da ‘A’, ‘M’, ‘R’)

Request: /rvfu/sh/cr/veicolo?tipoVeicolo=T&targa=AG004553&codiceFiscale=NTSPRM71L20H501B&causale=D

Response:
{
    "result": {
        "targa": "AG004553",
        "telaio": "11705",
        "tipoVeicolo": "T",
        "modello": "DEIDONE' B 32 DR ",
        "dataImmatricolazione": "1968-01-01T00:00:00",
        "obbligoIscrizionePRA": "N",
        "radiabile": "SI",
        "ostativiEForzature": null,
        "vincoloOstativo": "NO",
        "soggettoVeicolo": null,
        "tipoUtilizzoVeicolo": null,
        "destinazioneVeicolo": null,
        "regimeVeicolo": "1",
        "dataRegistrazione": null,
        "statoVFU": null,
        "enteRitiro": null,
        "enteConferimento": null,
        "causale": null,
        "cic": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}



 

Campi obbligatori: 
tipoVeicolo

Valori ammissibili:
tipoVeicolo: 		              AUTOVEICOLO("A"),
                                               MOTOVEICOLO("M"),
                                               RIMORCHIO("R"),
                                               MACCHINEAGRICOLESEMOVENTI2ASSI("S"),
                                               RIMORCHIAGRICOLI("T"),
                                               MACCHINEAGRICOLEOPERATRICI("V"),
                                               MACCHINEOPERATRICITRAINATE("N"),
                                               MACCHINEOPERATRICISEMOVENTI("P"),
                                               MACCHINEOPERATRICINONCIRCOLANTI("Z"),
                                               CICLOMOTORE("C"),
                                               MACCHINEAGRICOLESEMOVENTI1ASSE("U"),
                                               MACCHINEAGRICOLEOPERATRICITRAINATE("X"),
                                               RIMORCHIAGRICOLIMASSAPIENOCARICONONSUP("Y"),
                                               FILOVEICOLO("F");

Lunghezza campi string nella Request:
    targa(min=1, max=8)
    tipoVeicolo(min=1, max=1)


 


VFU (CR)
POST /rvfu/sh/cr/VFU (Permette la registrazione di un veicolo fuori uso)
Request: /rvfu/sh/cr/VFU
{
dataRitiro: "2005-08-28T00:00:00Z"
destinazioneVeicolo: null
detentore: null
documentoDelega: null
fabbrica: "METALMEC ME 35C "
flagConsegnaForzeOrdine: "N"
flagIntestatarioForzato: "S"
flagTipoRegime: "1"
forzaRegistrazione: "N"
    intestatario: {
    capResidenza: "00100"
    codiceComuneResidenza: "091"
    codiceFiscale: "MROBNI82B11H501L"
    codiceProvinciaResidenza: "058"
    cognome: "Bianchi"
    dataNascita: "1982-02-11T00:00:00Z"
    indirizzoResidenza: "Via Flaminia, 4"
    nome: "Mario"
noteAggiuntive: "note registrazione"
obbligoIscrizionePRA: "N"
ostativiEForzature: null
targa: "AG004557"
telaio: "0037"
tipoUtilizzoVeicolo: null
tipoVeicolo: "T"
causale: "D"
}
Response:
{
    "result": {
        "idVFU": 39002,
        "tipoVeicolo": "T",
        "targa": "AG004557",
        "telaio": "0037",
        "destinazioneVeicolo": null,
        "tipoUtilizzoVeicolo": null,
        "fabbrica": "METALMEC ME 35C",
        "obbligoIscrizionePRA": "N",
        "dataRitiro": "2005-08-28T00:00:00",
        "dataRegistrazione": "2024-01-31T11:03:26",
        "codiceFiscaleRitiro": "02018850061",
        "matricolaRegistrazione": "DETO000101",
        "dataConferimento": "2024-01-31T11:03:26",
        "codiceFiscaleConferimento": "02018850061",
        "matricolaConferimento": "DETO000101",
        "dataPresaInCarico": "2024-01-31T11:03:26",
        "flagArchivioProvenienza": null,
        "flagConsegnaForzeOrdine": "N",
        "codiceFiscaleTrasferimento": null,
        "dataDemolizione": null,
        "dataDistruzioneTarga": null,
        "numeroTargheDistrutte": null,
        "dataDistruzioneDocumenti": null,
        "flagTipoRegime": "1",
        "codiceAgenziaSTA": null,
        "dataCancellazioneArchivi": null,
        "dataUltimoAggiornamento": "2024-01-31T11:03:26",
        "noteAggiuntive": "note registrazione",
        "matricolaAggiornamento": null,
        "motivoEliminazione": null,
        "motivoTrasferimento": null,
        "dataNotificaInoltroSTA": null,
        "statoVFU": "PRESO IN CARICO",
        "dataStatoVFU": "2024-01-31T11:03:26",
        "intestatario": {
            "idSoggetto": 38002,
            "idVFU": 39002,
            "tipoSoggetto": "Intestatario inserito manualmente",
            "nome": "MARIO",
            "cognome": "BIANCHI",
            "codiceFiscale": "MROBNI82B11H501L",
            "dataNascita": "1982-02-11T00:00:00",
            "provinciaNascita": null,
            "comuneNascita": null,
            "statoEsteroNascita": null,
            "localitaEsteraNascita": null,
            "provinciaResidenza": {
                "codice": "058",
                "denominazione": "ROMA",
                "sigla": "RM"
            },
            "comuneResidenza": {
                "codice": "091",
                "denominazione": "ROMA"
            },
            "toponimoResidenza": null,
            "indirizzoResidenza": "VIA FLAMINIA, 4",
            "numeroCivicoResidenza": null,
            "capResidenza": "00100",
            "statoEsteroResidenza": null,
            "localitaEsteraResidenza": null,
            "tipoPersonaGiuridica": null,
            "ragioneSociale": null,
            "dataInserimento": "2024-01-31T11:03:26",
            "matricolaInserimento": "DETO000101",
            "matricolaAggiornamento": null,
            "badgeUtenteAggiornamento": null,
            "dataUltimoAggiornamento": "2024-01-31T11:03:26"
        },
        "detentore": null,
        "idCertificato": null,
        "idRicevuta": null,
        "codiceCertificato": null,
        "codiceRicevuta": null,
        "dataEmissioneCertificato": null,
        "dataEmissioneRicevuta": null,
        "dataChiusuraFascicolo": null,
        "idFascicolo": null,
        "statoFascicolo": null,
        "impresaRitiro": null,
        "impresaConferimento": null,
        "impresaTrasferimento": null,
        "agenziaSTA": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}

Lunghezza campi string nella Request (dei campi obbligatori e facoltativi):
tipoVeicolo (min=1, max=1) 
targa (min=1, max=8)
telaio (min=1, max=20)
destinazioneVeicolo (min=1, max=60)
tipoUtilizzoVeicolo (min=1, max=60)
fabbrica (min=1, max=120)
flagConsegnaForzeOrdine (min=1, max=1)
noteAggiuntive (min=1, max=600)
flagIntestatarioForzato (min=1, max=1)
forzaRegistrazione (min=1, max=1)
    intestatario: {
        nome (min=1, max=60)
        cognome (min=1, max=60)
        codiceFiscale (min=1, max=16)
        codiceProvinciaNascita (min=3, max=3)
        codiceComuneNascita (min=3, max=3)
        codiceStatoEsteroNascita (min=3, max=3)
        localitaEsteraNascita (min=1, max=22)
        codiceProvinciaResidenza (min=3, max=3)
        codiceComuneResidenza (min=3, max=3)
        toponimoResidenza (min=1, max=30)
        indirizzoResidenza (min=1, max=24)
        numeroCivicoResidenza (min=1, max=10)
                  capResidenza (min=1,max=15)
                  codiceStatoEsteroResidenza (min=3, max=3)
        localitaEsteraResidenza (min=1, max=22)
        tipoPersonaGiuridica (min=3, max=3)
        ragioneSociale (min=1, max=120)
    }
    detentore: {
                                                    nome (min=1, max=60)
cognome (min=1, max=60)
                                                codiceFiscale (min=1, max=16)
codiceProvinciaNascita (min=3, max=3)
                                                        codiceComuneNascita (min=3, max=3)
                                                    codiceStatoEsteroNascita (min=3, max=3)
                                                    localitaEsteraNascita (min=1, max=22)
                                                codiceProvinciaResidenza (min=3, max=3)
                                                codiceComuneResidenza (min=3, max=3)
                                                    toponimoResidenza (min=1, max=30)
                                                    indirizzoResidenza (min=1, max=24)
                                                        numeroCivicoResidenza (min=1, max=10)
                                                          capResidenza (min=1,max=15)
                                                          codiceStatoEsteroResidenza (min=3, max=3)
                                                        localitaEsteraResidenza (min=1, max=22)
                                                        tipoPersonaGiuridica (min=3, max=3)
                                                    ragioneSociale (min=1, max=120)
                                         }
    
    


Campi obbligatori:
tipoVeicolo
targa
dataRitiro
flagConsegnaForzeOrdine
forzaRegistrazione
intestatario: {
indirizzoResidenza
  }

Valori ammissibili:
tipoVeicolo: 		              AUTOVEICOLO("A"),
                                               MOTOVEICOLO("M"),
                                               RIMORCHIO("R"),
                                               MACCHINEAGRICOLESEMOVENTI2ASSI("S"),
                                               RIMORCHIAGRICOLI("T"),
                                               MACCHINEAGRICOLEOPERATRICI("V"),
                                               MACCHINEOPERATRICITRAINATE("N"),
                                               MACCHINEOPERATRICISEMOVENTI("P"),
                                               MACCHINEOPERATRICINONCIRCOLANTI("Z"),
                                               CICLOMOTORE("C"),
                                               MACCHINEAGRICOLESEMOVENTI1ASSE("U"),
                                               MACCHINEAGRICOLEOPERATRICITRAINATE("X"),
                                               RIMORCHIAGRICOLIMASSAPIENOCARICONONSUP("Y"),
                                               FILOVEICOLO("F");
forzaRegistrazione:                       SI ("S")
                                                         NO("N")
flagIntestatarioForzato:               SI ("S")
                                                         NO("N")
 

GET /rvfu/sh/cr/VFU/{idVFU} (Ritorna il dettaglio di un veicolo fuori uso)
Request:
https://c-api.servizipdt.it/demolitori-aci-ws/rest/cr/VFU/60005

Response:
{
    "result": {
        "idVFU": 60005,
        "tipoVeicolo": "A",
        "targa": "VA311AA",
        "telaio": "WDB2037081A565940",
        "destinazioneVeicolo": "A",
        "tipoUtilizzoVeicolo": "0",
        "fabbrica": "DAIMLERCHRYSLER AGMB203CL R80CF0TCABA401",
        "obbligoIscrizionePRA": "S",
        "dataRitiro": "2024-03-05T00:00:00",
        "dataRegistrazione": "2024-03-05T17:22:22",
        "codiceFiscaleRitiro": "02136780984",
        "matricolaSedeRitiro": "MICN0001",
        "indirizzoRitiro": null,
        "matricolaRegistrazione": "CNMI000103",
        "dataConferimento": "2024-03-05T17:23:18",
        "codiceFiscaleConferimento": "02018850061",
        "matricolaSedeConferimento": "TODE0001",
        "matricolaConferimento": "CNMI000103",
        "indirizzoConferimento": null,
        "dataPresaInCarico": "2024-03-05T17:33:58",
        "flagArchivioProvenienza": null,
        "flagConsegnaForzeOrdine": "N",
        "codiceFiscaleTrasferimento": null,
        "matricolaSedeTrasferimento": null,
        "indirizzoTrasferimento": null,
        "dataDemolizione": null,
        "dataDistruzioneTarga": null,
        "numeroTargheDistrutte": null,
        "dataDistruzioneDocumenti": null,
        "flagTipoRegime": "2",
        "codiceAgenziaSTA": null,
        "dataCancellazioneArchivi": null,
        "dataUltimoAggiornamento": "2024-03-05T17:33:58",
        "noteAggiuntive": null,
        "matricolaAggiornamento": "DETO000101",
        "motivoEliminazione": null,
        "motivoTrasferimento": null,
        "dataNotificaInoltroSTA": null,
        "statoVFU": "PRESO IN CARICO",
        "dataStatoVFU": "2024-03-05T17:33:58",
        "intestatario": {
            "idSoggetto": 59006,
            "idVFU": 60005,
            "tipoSoggetto": "Intestatario",
            "nome": "MARCO",
            "cognome": "VITA",
            "codiceFiscale": "VTIMRC64H23H501F",
            "dataNascita": "1964-06-23T00:00:00",
            "provinciaNascita": null,
            "comuneNascita": null,
            "statoEsteroNascita": null,
            "localitaEsteraNascita": null,
            "provinciaResidenza": null,
            "comuneResidenza": null,
            "toponimoResidenza": null,
            "indirizzoResidenza": "VIA ADDA 2",
            "numeroCivicoResidenza": null,
            "capResidenza": null,
            "statoEsteroResidenza": null,
            "localitaEsteraResidenza": null,
            "tipoPersonaGiuridica": null,
            "ragioneSociale": null,
            "dataInserimento": "2024-03-05T17:22:22",
            "matricolaInserimento": "CNMI000103",
            "matricolaAggiornamento": null,
            "badgeUtenteAggiornamento": null,
            "dataUltimoAggiornamento": "2024-03-05T17:22:22"
        },
        "detentore": null,
        "idCertificato": 283,
        "idRicevuta": null,
        "codiceCertificato": "20240305CD000000022001044",
        "codiceRicevuta": null,
        "dataEmissioneCertificato": "2024-03-05T17:23:18",
        "dataEmissioneRicevuta": null,
        "dataChiusuraFascicolo": null,
        "idFascicolo": 59005,
        "statoFascicolo": "Inserito",
        "impresaRitiro": {
            "tipoImpresaGestioneVFU": "Concessionario",
            "codiceFiscale": "02136780984",
            "matricolaSede": "MICN0001",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "comuneResidenza": "CERNUSCO SUL NAVIGLIO",
            "provinciaResidenza": "MILANO",
            "tipoSocieta": "SRL",
            "toponimoResidenza": "",
            "indirizzoResidenza": "VIA ACHILLE GRANDI",
            "civicoResidenza": "4",
            "indirizzoSede": " VIA ACHILLE GRANDI 4"
        },
        "impresaConferimento": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "matricolaSede": "TODE0001",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "comuneResidenza": "BITRITTO",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL",
            "toponimoResidenza": "",
            "indirizzoResidenza": "STRADA STATALE 271 KM.8,680",
            "civicoResidenza": "",
            "indirizzoSede": " STRADA STATALE 271 KM.8,680 "
        },
        "impresaTrasferimento": null,
        "agenziaSTA": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}


PUT /rvfu/sh/cr/VFU/{idVFU} (Permette la modifica di un veicolo fuori uso)
Request: /rvfu/sh/cr/VFU/37001
{
    detentore: null
    flagRitornaRadiato: "N"
    intestatario: null
    noteAggiuntive: "prova 123"
}
Response:
{
    "result": {
        "idVFU": 37001,
        "tipoVeicolo": "T",
        "targa": "AG004564",
        "telaio": "16871",
        "destinazioneVeicolo": null,
        "tipoUtilizzoVeicolo": null,
        "fabbrica": "DEIDONE' B 32 DR",
        "obbligoIscrizionePRA": "N",
        "dataRitiro": "2024-01-09T00:00:00",
        "dataRegistrazione": "2024-01-29T10:54:31",
        "codiceFiscaleRitiro": "02018850061",
        "matricolaRegistrazione": "DETO000101",
        "dataConferimento": "2024-01-29T10:54:31",
        "codiceFiscaleConferimento": "02018850061",
        "matricolaConferimento": "DETO000101",
        "dataPresaInCarico": "2024-01-29T10:54:31",
        "flagArchivioProvenienza": null,
        "flagConsegnaForzeOrdine": "N",
        "codiceFiscaleTrasferimento": null,
        "dataDemolizione": null,
        "dataDistruzioneTarga": null,
        "numeroTargheDistrutte": null,
        "dataDistruzioneDocumenti": null,
        "flagTipoRegime": "1",
        "codiceAgenziaSTA": null,
        "dataCancellazioneArchivi": "2024-01-29T11:52:20",
        "dataUltimoAggiornamento": "2024-01-29T12:03:21",
        "noteAggiuntive": "prova 123",
        "matricolaAggiornamento": "DETO000101",
        "motivoEliminazione": null,
        "motivoTrasferimento": null,
        "dataNotificaInoltroSTA": null,
        "statoVFU": "RADIATO",
        "dataStatoVFU": "2024-01-29T12:03:21",
        "intestatario": {
            "idSoggetto": 36001,
            "idVFU": 37001,
            "tipoSoggetto": "Intestatario inserito manualmente",
            "nome": "FRANCO",
            "cognome": "PIPPO",
            "codiceFiscale": "FRRPLA92A22C349S",
            "dataNascita": "2024-01-29T00:00:00",
            "provinciaNascita": null,
            "comuneNascita": null,
            "statoEsteroNascita": null,
            "localitaEsteraNascita": null,
            "provinciaResidenza": {
                "codice": "037",
                "denominazione": "BOLOGNA",
                "sigla": "BO"
            },
            "comuneResidenza": {
                "codice": "011",
                "denominazione": "CASALECCHIO DI RENO"
            },
            "toponimoResidenza": null,
            "indirizzoResidenza": "ASC",
            "numeroCivicoResidenza": null,
            "capResidenza": "87100",
            "statoEsteroResidenza": null,
            "localitaEsteraResidenza": null,
            "tipoPersonaGiuridica": null,
            "ragioneSociale": null,
            "dataInserimento": "2024-01-29T10:54:32",
            "matricolaInserimento": "DETO000101",
            "matricolaAggiornamento": null,
            "badgeUtenteAggiornamento": null,
            "dataUltimoAggiornamento": "2024-01-29T10:54:32"
        },
        "detentore": null,
        "idCertificato": 177,
        "idRicevuta": 176,
        "codiceCertificato": "20240129CD000000032000040",
        "codiceRicevuta": "20240129RD000000030000040",
        "dataEmissioneCertificato": "2024-01-29T11:32:21",
        "dataEmissioneRicevuta": "2024-01-29T10:55:27",
        "dataChiusuraFascicolo": "2024-01-29T11:32:40",
        "idFascicolo": 36001,
        "statoFascicolo": "Chiuso",
        "impresaRitiro": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL"
        },
        "impresaConferimento": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL"
        },
        "impresaTrasferimento": null,
        "agenziaSTA": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}

Lunghezza campi string nella Request:
noteAggiuntive (min=1, max=600)
flagRitornaRadiato (min=1, max=1)
intestatario e detentore:
        nome (min=1, max=60)
        cognome (min=1, max=60)
        codiceFiscale min=1, max=16)
        codiceProvinciaNascita (min=3, max=3)
        codiceComuneNascita (min=3, max=3)
        codiceStatoEsteroNascita (min=3, max=3)
        localitaEsteraNascita (min=1, max=22)
        codiceProvinciaResidenza (min=3, max=3)
        codiceComuneResidenza (min=3, max=3)
        toponimoResidenza (min=1, max=30)
        indirizzoResidenza (min=1, max=24)
        numeroCivicoResidenza (min=1, max=10)
        capResidenza (min=1,max=15)
        codiceStatoEsteroResidenza (min=3, max=3)
        localitaEsteraResidenza (min=1, max=22)
        tipoPersonaGiuridica (min=3, max=3)
        ragioneSociale (min=1, max=120)

Campi obbligatori:
flagRitornaRadiato
Valori ammissibili:

 

PUT /rvfu/sh/cr/annulla/VFU/{idVFU} (Permette l'annullamento di un veicolo fuori uso)
Request: /rvfu/sh/cr/annulla/VFU/36001
{
    motivoEliminazione: "motivo 1"
}
Response:
{
    "result": null,
    "esito": {
        "responseStatus": "KO",
        "message": "ERRORE CAMBIAMENTO STATO VFU",
        "code": "1001"
    }
}
Lunghezza campi string nella Request:
motivoEliminazione (min=1, max=600)
Campi obbligatori:
motivoEliminazione
Valori ammissibili:

PUT /rvfu/sh/cr/confermaRadiazioneVFU/VFU/{idVFU} (Conferma la radiazione di un VFU, cambiando lo stato da 'Assegnato a STA' a 'Radiato')
Request: /rvfu/sh/cr/confermaRadiazioneVFU/VFU/37001
{
}
Response:
{
    "result": {
        "idVFU": 37001,
        "statoVFU": "RADIATO"
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
GET /rvfu/sh/cr/consulta/VFU (Ritorna la lista paginata dei veicoli fuori uso visibili al CR)
Request: /rvfu/sh/cr/consulta/VFU?size=10&page=0&obbligoIscrizionePRA=S
Response:
{
    "result": {
        "content": [
            {
                "idVFU": 22001,
                "tipoVeicolo": "A",
                "targa": "VA320AA",
                "telaio": "WVWZZZ1JZ1W537734",
                "destinazioneVeicolo": "A",
                "tipoUtilizzoVeicolo": "0",
                "fabbrica": "VW 1J STAZDX01 SGFM52K028M41N10GG  BORA ST",
                "obbligoIscrizionePRA": "S",
                "dataRitiro": "2023-11-20T00:00:00",
                "dataRegistrazione": "2023-11-21T10:58:56",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2023-11-21T10:58:56",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2023-11-21T10:58:56",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "2",
                "codiceAgenziaSTA": "AG2096",
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-24T15:14:37",
                "noteAggiuntive": "prova",
                "matricolaAggiornamento": "DETO000101",
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": "2023-12-22T16:21:25",
                "statoVFU": "INVIATO A STA",
                "dataStatoVFU": "2024-01-24T15:14:37",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 142,
                "idRicevuta": null,
                "codiceCertificato": "20231121CD000000070000040",
                "codiceRicevuta": null,
                "dataEmissioneCertificato": "2023-11-21T10:59:28",
                "dataEmissioneRicevuta": null,
                "dataChiusuraFascicolo": "2023-11-21T11:01:04",
                "idFascicolo": 21001,
                "statoFascicolo": "Chiuso",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 32002,
                "tipoVeicolo": "A",
                "targa": "VA342AA",
                "telaio": "WVWZZZAUZDP014981",
                "destinazioneVeicolo": "A",
                "tipoUtilizzoVeicolo": "0",
                "fabbrica": "VOLKSWAGEN GOLF",
                "obbligoIscrizionePRA": "S",
                "dataRitiro": "2024-01-18T00:00:00",
                "dataRegistrazione": "2024-01-18T17:32:50",
                "codiceFiscaleRitiro": "02136780984",
                "matricolaRegistrazione": "CNMI000103",
                "dataConferimento": "2024-01-23T11:13:34",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "CNMI000103",
                "dataPresaInCarico": "2024-01-24T10:07:11",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": "12345678903",
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "2",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-24T10:16:19",
                "noteAggiuntive": "prova",
                "matricolaAggiornamento": "DETO000101",
                "motivoEliminazione": null,
                "motivoTrasferimento": "prova 1",
                "dataNotificaInoltroSTA": null,
                "statoVFU": "TRASFERITO a 12345678903",
                "dataStatoVFU": "2024-01-24T10:16:19",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 168,
                "idRicevuta": null,
                "codiceCertificato": "20240123CD000000020001044",
                "codiceRicevuta": null,
                "dataEmissioneCertificato": "2024-01-23T11:13:34",
                "dataEmissioneRicevuta": null,
                "dataChiusuraFascicolo": null,
                "idFascicolo": 31002,
                "statoFascicolo": "Inserito",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 31001,
                "tipoVeicolo": "A",
                "targa": "VA339AA",
                "telaio": "WVWZZZ1KZDW539926",
                "destinazioneVeicolo": "A",
                "tipoUtilizzoVeicolo": "0",
                "fabbrica": "VOLKSWAGEN GOLF PLUS",
                "obbligoIscrizionePRA": "S",
                "dataRitiro": "2024-01-16T00:00:00",
                "dataRegistrazione": "2024-01-16T12:27:03",
                "codiceFiscaleRitiro": "02136780984",
                "matricolaRegistrazione": "CNMI000103",
                "dataConferimento": "2024-01-16T12:34:22",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "CNMI000103",
                "dataPresaInCarico": "2024-01-26T15:52:49",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "2",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-26T15:52:49",
                "noteAggiuntive": "prova",
                "matricolaAggiornamento": "DETO000101",
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "PRESO IN CARICO",
                "dataStatoVFU": "2024-01-26T15:52:49",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 165,
                "idRicevuta": null,
                "codiceCertificato": "20240116CD000000015001044",
                "codiceRicevuta": null,
                "dataEmissioneCertificato": "2024-01-16T12:34:22",
                "dataEmissioneRicevuta": null,
                "dataChiusuraFascicolo": null,
                "idFascicolo": 30001,
                "statoFascicolo": "Inserito",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 32001,
                "tipoVeicolo": "A",
                "targa": "VA917AB",
                "telaio": "WF0XXXTTFXCD02649",
                "destinazioneVeicolo": "C",
                "tipoUtilizzoVeicolo": "4",
                "fabbrica": "FORD TRANSIT/TOURNEO",
                "obbligoIscrizionePRA": "S",
                "dataRitiro": "2024-01-18T00:00:00",
                "dataRegistrazione": "2024-01-18T17:27:01",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2024-01-18T17:27:01",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2024-01-18T17:27:01",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": "12345678903",
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "2",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-24T09:55:50",
                "noteAggiuntive": "prova",
                "matricolaAggiornamento": "DETO000101",
                "motivoEliminazione": null,
                "motivoTrasferimento": "prova",
                "dataNotificaInoltroSTA": null,
                "statoVFU": "TRASFERITO a 12345678903",
                "dataStatoVFU": "2024-01-24T09:55:50",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 166,
                "idRicevuta": null,
                "codiceCertificato": "20240118CD000000017000040",
                "codiceRicevuta": null,
                "dataEmissioneCertificato": "2024-01-18T17:27:12",
                "dataEmissioneRicevuta": null,
                "dataChiusuraFascicolo": null,
                "idFascicolo": 31001,
                "statoFascicolo": "Inserito",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 27001,
                "tipoVeicolo": "A",
                "targa": "VA350AA",
                "telaio": "WVWZZZ3BZ1P071214",
                "destinazioneVeicolo": "A",
                "tipoUtilizzoVeicolo": "0",
                "fabbrica": "VW 3BG STAVFX01 SGFM61E010NO  PASSAT    ST",
                "obbligoIscrizionePRA": "S",
                "dataRitiro": "2023-12-13T00:00:00",
                "dataRegistrazione": "2023-12-13T15:09:03",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2023-12-13T15:09:03",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2023-12-13T15:09:03",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "2",
                "codiceAgenziaSTA": "AG2096",
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-08T11:06:48",
                "noteAggiuntive": null,
                "matricolaAggiornamento": "DETO000101",
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": "2024-01-08T11:06:48",
                "statoVFU": "INVIATO A STA",
                "dataStatoVFU": "2024-01-08T11:06:48",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 159,
                "idRicevuta": null,
                "codiceCertificato": "20231213CD000000003000040",
                "codiceRicevuta": null,
                "dataEmissioneCertificato": "2023-12-13T19:07:31",
                "dataEmissioneRicevuta": null,
                "dataChiusuraFascicolo": "2023-12-13T19:09:31",
                "idFascicolo": 26001,
                "statoFascicolo": "Chiuso",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 30001,
                "tipoVeicolo": "A",
                "targa": "VA311AA",
                "telaio": "WDB2037081A565940",
                "destinazioneVeicolo": "A",
                "tipoUtilizzoVeicolo": "0",
                "fabbrica": "DAIMLERCHRYSLER AGMB203CL R80CF0TCABA401",
                "obbligoIscrizionePRA": "S",
                "dataRitiro": "2024-01-10T00:00:00",
                "dataRegistrazione": "2024-01-10T11:28:57",
                "codiceFiscaleRitiro": "02136780984",
                "matricolaRegistrazione": "CNMI000103",
                "dataConferimento": "2024-01-10T15:36:49",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "CNMI000103",
                "dataPresaInCarico": "2024-01-10T16:11:22",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "2",
                "codiceAgenziaSTA": "AG2096",
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-18T17:21:12",
                "noteAggiuntive": "prova",
                "matricolaAggiornamento": "DETO000101",
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": "2024-01-18T17:21:12",
                "statoVFU": "INVIATO A STA",
                "dataStatoVFU": "2024-01-18T17:21:12",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 164,
                "idRicevuta": null,
                "codiceCertificato": "20240110CD000000014001044",
                "codiceRicevuta": null,
                "dataEmissioneCertificato": "2024-01-10T15:36:49",
                "dataEmissioneRicevuta": null,
                "dataChiusuraFascicolo": "2024-01-18T17:20:26",
                "idFascicolo": 29001,
                "statoFascicolo": "Chiuso",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 33001,
                "tipoVeicolo": "A",
                "targa": "VA379AA",
                "telaio": "WVWZZZ3BZ1P094281",
                "destinazioneVeicolo": "A",
                "tipoUtilizzoVeicolo": "0",
                "fabbrica": "VW 3BG STAVFX01 SGFM61E010NO  PASSAT    ST",
                "obbligoIscrizionePRA": "S",
                "dataRitiro": "2024-01-22T00:00:00",
                "dataRegistrazione": "2024-01-22T10:37:32",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2024-01-22T10:37:32",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2024-01-22T10:37:32",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "2",
                "codiceAgenziaSTA": "AG2096",
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-24T15:42:26",
                "noteAggiuntive": "prova",
                "matricolaAggiornamento": "DETO000101",
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": "2024-01-24T15:42:26",
                "statoVFU": "INVIATO A STA",
                "dataStatoVFU": "2024-01-24T15:42:26",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 167,
                "idRicevuta": null,
                "codiceCertificato": "20240122CD000000018000040",
                "codiceRicevuta": null,
                "dataEmissioneCertificato": "2024-01-22T10:37:47",
                "dataEmissioneRicevuta": null,
                "dataChiusuraFascicolo": "2024-01-22T10:39:28",
                "idFascicolo": 32001,
                "statoFascicolo": "Chiuso",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            }
        ],
        "pageable": {
            "sort": {
                "sorted": false,
                "unsorted": true,
                "empty": true
            },
            "offset": 0,
            "pageNumber": 0,
            "pageSize": 10,
            "paged": true,
            "unpaged": false
        },
        "totalElements": 7,
        "totalPages": 1,
        "last": true,
        "size": 10,
        "number": 0,
        "sort": {
            "sorted": false,
            "unsorted": true,
            "empty": true
        },
        "first": true,
        "numberOfElements": 7,
        "empty": false
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
GET /rvfu/sh/cr/consultaPresaInCarico/VFU (Ritorna la lista paginata dei veicoli fuori uso da gestire nel processo di presa in carico)
Request: /rvfu/sh/cr/consultaPresaInCarico/VFU?size=10&page=0&obbligoIscrizionePRA=N
Response:
{
    "result": {
        "content": [
            {
                "idVFU": 39001,
                "tipoVeicolo": "T",
                "targa": "AG004555",
                "telaio": "0316",
                "destinazioneVeicolo": null,
                "tipoUtilizzoVeicolo": null,
                "fabbrica": "FERRUZZA RB 50",
                "obbligoIscrizionePRA": "N",
                "dataRitiro": "2004-01-31T00:00:00",
                "dataRegistrazione": "2024-01-31T10:09:02",
                "codiceFiscaleRitiro": "02136780984",
                "matricolaRegistrazione": "CNMI000103",
                "dataConferimento": "2024-01-31T10:17:02",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "CNMI000103",
                "dataPresaInCarico": null,
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "1",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-31T10:17:02",
                "noteAggiuntive": "note registrazione",
                "matricolaAggiornamento": "CNMI000103",
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "CONFERITO da 02136780984",
                "dataStatoVFU": "2024-01-31T10:17:02",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 184,
                "idRicevuta": 185,
                "codiceCertificato": "20240131CD000000042001044",
                "codiceRicevuta": "20240131RD000000043001044",
                "dataEmissioneCertificato": "2024-01-31T10:17:02",
                "dataEmissioneRicevuta": "2024-01-31T10:17:03",
                "dataChiusuraFascicolo": null,
                "idFascicolo": 38001,
                "statoFascicolo": "Inserito",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 39002,
                "tipoVeicolo": "T",
                "targa": "AG004557",
                "telaio": "0037",
                "destinazioneVeicolo": null,
                "tipoUtilizzoVeicolo": null,
                "fabbrica": "METALMEC ME 35C",
                "obbligoIscrizionePRA": "N",
                "dataRitiro": "2005-08-28T00:00:00",
                "dataRegistrazione": "2024-01-31T11:03:26",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2024-01-31T11:03:26",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2024-01-31T11:03:26",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "1",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-31T11:03:26",
                "noteAggiuntive": "note registrazione",
                "matricolaAggiornamento": null,
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "PRESO IN CARICO",
                "dataStatoVFU": "2024-01-31T11:03:26",
                "intestatario": null,
                "detentore": null,
                "idCertificato": null,
                "idRicevuta": null,
                "codiceCertificato": null,
                "codiceRicevuta": null,
                "dataEmissioneCertificato": null,
                "dataEmissioneRicevuta": null,
                "dataChiusuraFascicolo": null,
                "idFascicolo": 38002,
                "statoFascicolo": "Inserito",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 34001,
                "tipoVeicolo": "T",
                "targa": "AG004553",
                "telaio": "11705",
                "destinazioneVeicolo": null,
                "tipoUtilizzoVeicolo": null,
                "fabbrica": "DEIDONE' B 32 DR",
                "obbligoIscrizionePRA": "N",
                "dataRitiro": "2024-01-23T00:00:00",
                "dataRegistrazione": "2024-01-23T16:26:07",
                "codiceFiscaleRitiro": "02136780984",
                "matricolaRegistrazione": "CNMI000103",
                "dataConferimento": "2024-01-23T16:31:06",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "CNMI000103",
                "dataPresaInCarico": null,
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "1",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-23T16:31:06",
                "noteAggiuntive": "prova",
                "matricolaAggiornamento": "CNMI000103",
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "CONFERITO da 02136780984",
                "dataStatoVFU": "2024-01-23T16:31:06",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 169,
                "idRicevuta": 170,
                "codiceCertificato": "20240123CD000000021001044",
                "codiceRicevuta": "20240123RD000000022001044",
                "dataEmissioneCertificato": "2024-01-23T16:31:06",
                "dataEmissioneRicevuta": "2024-01-23T16:31:08",
                "dataChiusuraFascicolo": null,
                "idFascicolo": 33001,
                "statoFascicolo": "Inserito",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 35001,
                "tipoVeicolo": "T",
                "targa": "AG004559",
                "telaio": "0035",
                "destinazioneVeicolo": null,
                "tipoUtilizzoVeicolo": null,
                "fabbrica": "METALMEC ME 35C",
                "obbligoIscrizionePRA": "N",
                "dataRitiro": "2024-01-25T00:00:00",
                "dataRegistrazione": "2024-01-25T15:51:19",
                "codiceFiscaleRitiro": "02136780984",
                "matricolaRegistrazione": "CNMI000103",
                "dataConferimento": "2024-01-25T15:59:39",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "CNMI000103",
                "dataPresaInCarico": null,
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "1",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-25T15:59:39",
                "noteAggiuntive": "prova",
                "matricolaAggiornamento": "CNMI000103",
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "CONFERITO da 02136780984",
                "dataStatoVFU": "2024-01-25T15:59:39",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 171,
                "idRicevuta": 172,
                "codiceCertificato": "20240125CD000000023001044",
                "codiceRicevuta": "20240125RD000000024001044",
                "dataEmissioneCertificato": "2024-01-25T15:59:39",
                "dataEmissioneRicevuta": "2024-01-25T15:59:40",
                "dataChiusuraFascicolo": null,
                "idFascicolo": 34001,
                "statoFascicolo": "Inserito",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 28001,
                "tipoVeicolo": "C",
                "targa": "X3BM5V",
                "telaio": "VG5SA144000180025",
                "destinazioneVeicolo": "CICLOMOTORE",
                "tipoUtilizzoVeicolo": "PROPRIO",
                "fabbrica": "MBK INDUSTRIE SA14   VAR.I VERS.III",
                "obbligoIscrizionePRA": "N",
                "dataRitiro": "2023-12-16T00:00:00",
                "dataRegistrazione": "2023-12-16T10:58:03",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2023-12-16T10:58:03",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2023-12-16T10:58:03",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "1",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2023-12-16T10:58:03",
                "noteAggiuntive": null,
                "matricolaAggiornamento": null,
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "PRESO IN CARICO",
                "dataStatoVFU": "2023-12-16T10:58:03",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 161,
                "idRicevuta": 160,
                "codiceCertificato": "20231216CD000000006000040",
                "codiceRicevuta": "20231216RD000000005000040",
                "dataEmissioneCertificato": "2023-12-16T10:58:30",
                "dataEmissioneRicevuta": "2023-12-16T10:58:10",
                "dataChiusuraFascicolo": null,
                "idFascicolo": 27001,
                "statoFascicolo": "Inserito",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 37003,
                "tipoVeicolo": "T",
                "targa": "AG004560",
                "telaio": "0032",
                "destinazioneVeicolo": null,
                "tipoUtilizzoVeicolo": null,
                "fabbrica": "METALMEC ME 35C",
                "obbligoIscrizionePRA": "N",
                "dataRitiro": "2024-01-02T00:00:00",
                "dataRegistrazione": "2024-01-29T17:16:26",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2024-01-29T17:16:26",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2024-01-29T17:16:26",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "1",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-29T17:16:26",
                "noteAggiuntive": null,
                "matricolaAggiornamento": null,
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "PRESO IN CARICO",
                "dataStatoVFU": "2024-01-29T17:16:26",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 6918,
                "idRicevuta": 181,
                "codiceCertificato": "20240129CC000000038000040",
                "codiceRicevuta": "20240129RD000000037000040",
                "dataEmissioneCertificato": "2024-01-29T00:00:00",
                "dataEmissioneRicevuta": "2024-01-29T17:17:57",
                "dataChiusuraFascicolo": null,
                "idFascicolo": 36003,
                "statoFascicolo": "Inserito",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            }
        ],
        "pageable": {
            "sort": {
                "sorted": false,
                "unsorted": true,
                "empty": true
            },
            "offset": 0,
            "pageNumber": 0,
            "pageSize": 10,
            "paged": true,
            "unpaged": false
        },
        "totalElements": 6,
        "totalPages": 1,
        "last": true,
        "size": 10,
        "number": 0,
        "sort": {
            "sorted": false,
            "unsorted": true,
            "empty": true
        },
        "first": true,
        "numberOfElements": 6,
        "empty": false
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
GET /rvfu/sh/cr/consultaRadiati/VFU (Ritorna la lista paginata dei veicoli fuori uso radiati)
Request: /rvfu/sh/cr/consultaRadiati/VFU?size=10&page=0&obbligoIscrizionePRA=N
Response:
{
    "result": {
        "content": [
            {
                "idVFU": 29001,
                "tipoVeicolo": "C",
                "targa": "X2FDFG",
                "telaio": "ZD4THE0066S003991",
                "destinazioneVeicolo": "CICLOMOTORE",
                "tipoUtilizzoVeicolo": "PROPRIO",
                "fabbrica": "APRILIA SPA TH VAR.E VERS.00",
                "obbligoIscrizionePRA": "N",
                "dataRitiro": "2023-12-18T00:00:00",
                "dataRegistrazione": "2023-12-18T10:40:24",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2023-12-18T10:40:24",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2023-12-18T10:40:24",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "1",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": "2023-12-19T10:08:24",
                "dataUltimoAggiornamento": "2023-12-19T10:08:24",
                "noteAggiuntive": "FORZATO",
                "matricolaAggiornamento": "DETO000101",
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "RADIATO",
                "dataStatoVFU": "2023-12-19T10:08:24",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 163,
                "idRicevuta": 162,
                "codiceCertificato": "20231218CD000000010000040",
                "codiceRicevuta": "20231218RD000000009000040",
                "dataEmissioneCertificato": "2023-12-18T10:40:38",
                "dataEmissioneRicevuta": "2023-12-18T10:40:31",
                "dataChiusuraFascicolo": "2023-12-19T10:08:16",
                "idFascicolo": 28001,
                "statoFascicolo": "Chiuso",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 36001,
                "tipoVeicolo": "T",
                "targa": "AG004552",
                "telaio": "0419",
                "destinazioneVeicolo": null,
                "tipoUtilizzoVeicolo": null,
                "fabbrica": "FERRUZZA PT 40",
                "obbligoIscrizionePRA": "N",
                "dataRitiro": "2024-01-25T00:00:00",
                "dataRegistrazione": "2024-01-26T09:42:58",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2024-01-26T09:42:58",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2024-01-26T09:42:58",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "1",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": "2024-01-29T19:06:19",
                "dataUltimoAggiornamento": "2024-01-29T19:06:19",
                "noteAggiuntive": null,
                "matricolaAggiornamento": "DETO000101",
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "RADIATO",
                "dataStatoVFU": "2024-01-29T19:06:19",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 174,
                "idRicevuta": 173,
                "codiceCertificato": "20240126CD000000027000040",
                "codiceRicevuta": "20240126RD000000026000040",
                "dataEmissioneCertificato": "2024-01-26T09:43:21",
                "dataEmissioneRicevuta": "2024-01-26T09:43:16",
                "dataChiusuraFascicolo": "2024-01-29T14:36:27",
                "idFascicolo": 35001,
                "statoFascicolo": "Chiuso",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 37001,
                "tipoVeicolo": "T",
                "targa": "AG004564",
                "telaio": "16871",
                "destinazioneVeicolo": null,
                "tipoUtilizzoVeicolo": null,
                "fabbrica": "DEIDONE' B 32 DR",
                "obbligoIscrizionePRA": "N",
                "dataRitiro": "2024-01-09T00:00:00",
                "dataRegistrazione": "2024-01-29T10:54:31",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2024-01-29T10:54:31",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2024-01-29T10:54:31",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "1",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": "2024-01-29T11:52:20",
                "dataUltimoAggiornamento": "2024-01-29T12:03:21",
                "noteAggiuntive": "prova 123",
                "matricolaAggiornamento": "DETO000101",
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "RADIATO",
                "dataStatoVFU": "2024-01-29T12:03:21",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 177,
                "idRicevuta": 176,
                "codiceCertificato": "20240129CD000000032000040",
                "codiceRicevuta": "20240129RD000000030000040",
                "dataEmissioneCertificato": "2024-01-29T11:32:21",
                "dataEmissioneRicevuta": "2024-01-29T10:55:27",
                "dataChiusuraFascicolo": "2024-01-29T11:32:40",
                "idFascicolo": 36001,
                "statoFascicolo": "Chiuso",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            }
        ],
        "pageable": {
            "sort": {
                "sorted": false,
                "unsorted": true,
                "empty": true
            },
            "offset": 0,
            "pageNumber": 0,
            "pageSize": 10,
            "paged": true,
            "unpaged": false
        },
        "totalElements": 3,
        "totalPages": 1,
        "last": true,
        "size": 10,
        "number": 0,
        "sort": {
            "sorted": false,
            "unsorted": true,
            "empty": true
        },
        "first": true,
        "numberOfElements": 3,
        "empty": false
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
GET /rvfu/sh/cr/consultaRottamazione/VFU (Ritorna la lista paginata dei veicoli fuori uso da gestire nel processo di rottamazione)
Request: /rvfu/sh/cr/consultaRottamazione/VFU?size=10&page=0&obbligoIscrizionePRA=N
Response:
{
    "result": {
        "content": [
            {
                "idVFU": 36001,
                "tipoVeicolo": "T",
                "targa": "AG004552",
                "telaio": "0419",
                "destinazioneVeicolo": null,
                "tipoUtilizzoVeicolo": null,
                "fabbrica": "FERRUZZA PT 40",
                "obbligoIscrizionePRA": "N",
                "dataRitiro": "2024-01-25T00:00:00",
                "dataRegistrazione": "2024-01-26T09:42:58",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2024-01-26T09:42:58",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2024-01-26T09:42:58",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "1",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-29T14:36:27",
                "noteAggiuntive": null,
                "matricolaAggiornamento": "DETO000101",
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "DA RADIARE",
                "dataStatoVFU": "2024-01-29T14:36:27",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 174,
                "idRicevuta": 173,
                "codiceCertificato": "20240126CD000000027000040",
                "codiceRicevuta": "20240126RD000000026000040",
                "dataEmissioneCertificato": "2024-01-26T09:43:21",
                "dataEmissioneRicevuta": "2024-01-26T09:43:16",
                "dataChiusuraFascicolo": "2024-01-29T14:36:27",
                "idFascicolo": 35001,
                "statoFascicolo": "Chiuso",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 36002,
                "tipoVeicolo": "T",
                "targa": "AG004554",
                "telaio": "0056",
                "destinazioneVeicolo": null,
                "tipoUtilizzoVeicolo": null,
                "fabbrica": "VENEZIA VE 40 P",
                "obbligoIscrizionePRA": "N",
                "dataRitiro": "2024-01-26T00:00:00",
                "dataRegistrazione": "2024-01-26T17:28:13",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2024-01-26T17:28:13",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2024-01-26T17:28:13",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "1",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-26T17:28:13",
                "noteAggiuntive": null,
                "matricolaAggiornamento": null,
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "PRESO IN CARICO",
                "dataStatoVFU": "2024-01-26T17:28:13",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 175,
                "idRicevuta": null,
                "codiceCertificato": "20240126CD000000029000040",
                "codiceRicevuta": null,
                "dataEmissioneCertificato": "2024-01-26T17:28:32",
                "dataEmissioneRicevuta": null,
                "dataChiusuraFascicolo": null,
                "idFascicolo": 35002,
                "statoFascicolo": "Inserito",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 37002,
                "tipoVeicolo": "T",
                "targa": "AG004562",
                "telaio": "0040",
                "destinazioneVeicolo": null,
                "tipoUtilizzoVeicolo": null,
                "fabbrica": "METALMEC ME 40D",
                "obbligoIscrizionePRA": "N",
                "dataRitiro": "2024-01-29T00:00:00",
                "dataRegistrazione": "2024-01-29T15:03:50",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2024-01-29T15:03:50",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2024-01-29T15:03:50",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "1",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2024-01-29T15:03:50",
                "noteAggiuntive": null,
                "matricolaAggiornamento": null,
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "PRESO IN CARICO",
                "dataStatoVFU": "2024-01-29T15:03:50",
                "intestatario": null,
                "detentore": null,
                "idCertificato": null,
                "idRicevuta": 178,
                "codiceCertificato": null,
                "codiceRicevuta": "20240129RD000000034000040",
                "dataEmissioneCertificato": null,
                "dataEmissioneRicevuta": "2024-01-29T15:05:28",
                "dataChiusuraFascicolo": null,
                "idFascicolo": 36002,
                "statoFascicolo": "Inserito",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            },
            {
                "idVFU": 28001,
                "tipoVeicolo": "C",
                "targa": "X3BM5V",
                "telaio": "VG5SA144000180025",
                "destinazioneVeicolo": "CICLOMOTORE",
                "tipoUtilizzoVeicolo": "PROPRIO",
                "fabbrica": "MBK INDUSTRIE SA14   VAR.I VERS.III",
                "obbligoIscrizionePRA": "N",
                "dataRitiro": "2023-12-16T00:00:00",
                "dataRegistrazione": "2023-12-16T10:58:03",
                "codiceFiscaleRitiro": "02018850061",
                "matricolaRegistrazione": "DETO000101",
                "dataConferimento": "2023-12-16T10:58:03",
                "codiceFiscaleConferimento": "02018850061",
                "matricolaConferimento": "DETO000101",
                "dataPresaInCarico": "2023-12-16T10:58:03",
                "flagArchivioProvenienza": null,
                "flagConsegnaForzeOrdine": "N",
                "codiceFiscaleTrasferimento": null,
                "dataDemolizione": null,
                "dataDistruzioneTarga": null,
                "numeroTargheDistrutte": null,
                "dataDistruzioneDocumenti": null,
                "flagTipoRegime": "1",
                "codiceAgenziaSTA": null,
                "dataCancellazioneArchivi": null,
                "dataUltimoAggiornamento": "2023-12-16T10:58:03",
                "noteAggiuntive": null,
                "matricolaAggiornamento": null,
                "motivoEliminazione": null,
                "motivoTrasferimento": null,
                "dataNotificaInoltroSTA": null,
                "statoVFU": "PRESO IN CARICO",
                "dataStatoVFU": "2023-12-16T10:58:03",
                "intestatario": null,
                "detentore": null,
                "idCertificato": 161,
                "idRicevuta": 160,
                "codiceCertificato": "20231216CD000000006000040",
                "codiceRicevuta": "20231216RD000000005000040",
                "dataEmissioneCertificato": "2023-12-16T10:58:30",
                "dataEmissioneRicevuta": "2023-12-16T10:58:10",
                "dataChiusuraFascicolo": null,
                "idFascicolo": 27001,
                "statoFascicolo": "Inserito",
                "impresaRitiro": null,
                "impresaConferimento": null,
                "impresaTrasferimento": null,
                "agenziaSTA": null
            }
        ],
        "pageable": {
            "sort": {
                "sorted": false,
                "unsorted": true,
                "empty": true
            },
            "offset": 0,
            "pageNumber": 0,
            "pageSize": 10,
            "paged": true,
            "unpaged": false
        },
        "totalElements": 4,
        "totalPages": 1,
        "last": true,
        "size": 10,
        "number": 0,
        "sort": {
            "sorted": false,
            "unsorted": true,
            "empty": true
        },
        "first": true,
        "numberOfElements": 4,
        "empty": false
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
PUT /rvfu/sh/cr/demolisci/VFU/{idVFU} (Permette l'assegnazione dello stato demolito ad un veicolo fuori uso)
Request: /rvfu/sh/cr/demolisci/VFU/37001
{
    dataDistruzioneDocumenti: "2024-01-31T23:59:59Z"
    dataDistruzioneTarga: "2024-01-25T23:59:59Z"
    numeroTargheDistrutte: "1"
}
Response:
{
    "result": {
        "idVFU": 37001,
        "tipoVeicolo": "T",
        "targa": "AG004564",
        "telaio": "16871",
        "destinazioneVeicolo": null,
        "tipoUtilizzoVeicolo": null,
        "fabbrica": "DEIDONE' B 32 DR",
        "obbligoIscrizionePRA": "N",
        "dataRitiro": "2024-01-09T00:00:00",
        "dataRegistrazione": "2024-01-29T10:54:31",
        "codiceFiscaleRitiro": "02018850061",
        "matricolaRegistrazione": "DETO000101",
        "dataConferimento": "2024-01-29T10:54:31",
        "codiceFiscaleConferimento": "02018850061",
        "matricolaConferimento": "DETO000101",
        "dataPresaInCarico": "2024-01-29T10:54:31",
        "flagArchivioProvenienza": null,
        "flagConsegnaForzeOrdine": "N",
        "codiceFiscaleTrasferimento": null,
        "dataDemolizione": null,
        "dataDistruzioneTarga": "2024-01-25T23:59:59",
        "numeroTargheDistrutte": 1,
        "dataDistruzioneDocumenti": "2024-01-31T23:59:59",
        "flagTipoRegime": "1",
        "codiceAgenziaSTA": null,
        "dataCancellazioneArchivi": "2024-01-29T11:52:20",
        "dataUltimoAggiornamento": "2024-01-31T12:23:32",
        "noteAggiuntive": "prova 123",
        "matricolaAggiornamento": "DETO000101",
        "motivoEliminazione": null,
        "motivoTrasferimento": null,
        "dataNotificaInoltroSTA": null,
        "statoVFU": "DEMOLITO",
        "dataStatoVFU": "2024-01-31T12:23:32",
        "intestatario": {
            "idSoggetto": 36001,
            "idVFU": 37001,
            "tipoSoggetto": "Intestatario inserito manualmente",
            "nome": "FRANCO",
            "cognome": "PIPPO",
            "codiceFiscale": "FRRPLA92A22C349S",
            "dataNascita": "2024-01-29T00:00:00",
            "provinciaNascita": null,
            "comuneNascita": null,
            "statoEsteroNascita": null,
            "localitaEsteraNascita": null,
            "provinciaResidenza": {
                "codice": "037",
                "denominazione": "BOLOGNA",
                "sigla": "BO"
            },
            "comuneResidenza": {
                "codice": "011",
                "denominazione": "CASALECCHIO DI RENO"
            },
            "toponimoResidenza": null,
            "indirizzoResidenza": "ASC",
            "numeroCivicoResidenza": null,
            "capResidenza": "87100",
            "statoEsteroResidenza": null,
            "localitaEsteraResidenza": null,
            "tipoPersonaGiuridica": null,
            "ragioneSociale": null,
            "dataInserimento": "2024-01-29T10:54:32",
            "matricolaInserimento": "DETO000101",
            "matricolaAggiornamento": null,
            "badgeUtenteAggiornamento": null,
            "dataUltimoAggiornamento": "2024-01-29T10:54:32"
        },
        "detentore": null,
        "idCertificato": 177,
        "idRicevuta": 176,
        "codiceCertificato": "20240129CD000000032000040",
        "codiceRicevuta": "20240129RD000000030000040",
        "dataEmissioneCertificato": "2024-01-29T11:32:21",
        "dataEmissioneRicevuta": "2024-01-29T10:55:27",
        "dataChiusuraFascicolo": "2024-01-29T11:32:40",
        "idFascicolo": 36001,
        "statoFascicolo": "Chiuso",
        "impresaRitiro": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL"
        },
        "impresaConferimento": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL"
        },
        "impresaTrasferimento": null,
        "agenziaSTA": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
Lunghezza campi string nella Request:

Campi obbligatori:
dataDistruzioneTarga
numeroTargheDistrutte
dataDistruzioneDocumenti
Valori ammissibili:
 

PUT /rvfu/sh/cr/inoltraSTA/VFU/{codiceSTA} (Permette l'inoltro di una lista di veicoli fuori uso ad un'agenzia STA)
Request: /rvfu/sh/cr/inoltraSTA/VFU/AG2096
{
    [40001]
}
Response:
{
    "result": [
        {
            "idVFU": 40001,
            "tipoVeicolo": "A",
            "targa": "VA212AB",
            "telaio": "ZFA19900000002418",
            "destinazioneVeicolo": "A",
            "tipoUtilizzoVeicolo": "0",
            "fabbrica": "FIAT AUTO SPA 199AXE1B 08B FIAT PUNTO",
            "obbligoIscrizionePRA": "S",
            "dataRitiro": "2024-02-01T00:00:00",
            "dataRegistrazione": "2024-02-01T10:04:39",
            "codiceFiscaleRitiro": "02018850061",
            "matricolaRegistrazione": "DETO000101",
            "dataConferimento": "2024-02-01T10:04:39",
            "codiceFiscaleConferimento": "02018850061",
            "matricolaConferimento": "DETO000101",
            "dataPresaInCarico": "2024-02-01T10:04:39",
            "flagArchivioProvenienza": null,
            "flagConsegnaForzeOrdine": "N",
            "codiceFiscaleTrasferimento": null,
            "dataDemolizione": null,
            "dataDistruzioneTarga": null,
            "numeroTargheDistrutte": null,
            "dataDistruzioneDocumenti": null,
            "flagTipoRegime": "2",
            "codiceAgenziaSTA": "AG2096",
            "dataCancellazioneArchivi": null,
            "dataUltimoAggiornamento": "2024-02-01T10:12:13",
            "noteAggiuntive": "note 1",
            "matricolaAggiornamento": "DETO000101",
            "motivoEliminazione": null,
            "motivoTrasferimento": null,
            "dataNotificaInoltroSTA": "2024-02-01T10:12:13",
            "statoVFU": "INVIATO A STA",
            "dataStatoVFU": "2024-02-01T10:12:13",
            "intestatario": null,
            "detentore": null,
            "idCertificato": 190,
            "idRicevuta": null,
            "codiceCertificato": "20240201CD000000053000040",
            "codiceRicevuta": null,
            "dataEmissioneCertificato": "2024-02-01T10:04:52",
            "dataEmissioneRicevuta": null,
            "dataChiusuraFascicolo": "2024-02-01T10:08:23",
            "idFascicolo": 39001,
            "statoFascicolo": "Chiuso",
            "impresaRitiro": null,
            "impresaConferimento": null,
            "impresaTrasferimento": null,
            "agenziaSTA": null
        }
    ],
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
PUT /rvfu/sh/cr/prendiInCarico/VFU/{idVFU} (Permette la presa in carico di un veicolo fuori uso conferito al CR)
Request: /rvfu/sh/cr/prendiInCarico/VFU/31001
{
}
Response:
{
    "result": {
        "idVFU": 31001,
        "tipoVeicolo": "A",
        "targa": "VA339AA",
        "telaio": "WVWZZZ1KZDW539926",
        "destinazioneVeicolo": "A",
        "tipoUtilizzoVeicolo": "0",
        "fabbrica": "VOLKSWAGEN GOLF PLUS",
        "obbligoIscrizionePRA": "S",
        "dataRitiro": "2024-01-16T00:00:00",
        "dataRegistrazione": "2024-01-16T12:27:03",
        "codiceFiscaleRitiro": "02136780984",
        "matricolaRegistrazione": "CNMI000103",
        "dataConferimento": "2024-01-16T12:34:22",
        "codiceFiscaleConferimento": "02018850061",
        "matricolaConferimento": "CNMI000103",
        "dataPresaInCarico": "2024-01-26T15:52:49",
        "flagArchivioProvenienza": null,
        "flagConsegnaForzeOrdine": "N",
        "codiceFiscaleTrasferimento": null,
        "dataDemolizione": null,
        "dataDistruzioneTarga": null,
        "numeroTargheDistrutte": null,
        "dataDistruzioneDocumenti": null,
        "flagTipoRegime": "2",
        "codiceAgenziaSTA": null,
        "dataCancellazioneArchivi": null,
        "dataUltimoAggiornamento": "2024-01-26T15:52:49",
        "noteAggiuntive": "prova",
        "matricolaAggiornamento": "DETO000101",
        "motivoEliminazione": null,
        "motivoTrasferimento": null,
        "dataNotificaInoltroSTA": null,
        "statoVFU": "PRESO IN CARICO",
        "dataStatoVFU": "2024-01-26T15:52:49",
        "intestatario": {
            "idSoggetto": 30001,
            "idVFU": 31001,
            "tipoSoggetto": "Intestatario inserito manualmente",
            "nome": "FRANCO",
            "cognome": "PIPPO",
            "codiceFiscale": "FRRPLA92A22C349S",
            "dataNascita": "2024-01-16T00:00:00",
            "provinciaNascita": null,
            "comuneNascita": null,
            "statoEsteroNascita": null,
            "localitaEsteraNascita": null,
            "provinciaResidenza": {
                "codice": "078",
                "denominazione": "COSENZA",
                "sigla": "CS"
            },
            "comuneResidenza": {
                "codice": "045",
                "denominazione": "COSENZA"
            },
            "toponimoResidenza": null,
            "indirizzoResidenza": "ASC",
            "numeroCivicoResidenza": null,
            "capResidenza": "87100",
            "statoEsteroResidenza": null,
            "localitaEsteraResidenza": null,
            "tipoPersonaGiuridica": null,
            "ragioneSociale": null,
            "dataInserimento": "2024-01-16T12:27:03",
            "matricolaInserimento": "CNMI000103",
            "matricolaAggiornamento": null,
            "badgeUtenteAggiornamento": null,
            "dataUltimoAggiornamento": "2024-01-16T12:27:03"
        },
        "detentore": null,
        "idCertificato": 165,
        "idRicevuta": null,
        "codiceCertificato": "20240116CD000000015001044",
        "codiceRicevuta": null,
        "dataEmissioneCertificato": "2024-01-16T12:34:22",
        "dataEmissioneRicevuta": null,
        "dataChiusuraFascicolo": null,
        "idFascicolo": 30001,
        "statoFascicolo": "Inserito",
        "impresaRitiro": {
            "tipoImpresaGestioneVFU": "Concessionario",
            "codiceFiscale": "02136780984",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "provinciaResidenza": "MILANO",
            "tipoSocieta": "SRL"
        },
        "impresaConferimento": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL"
        },
        "impresaTrasferimento": null,
        "agenziaSTA": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
PUT /rvfu/sh/cr/riassegnazioneVFUaSTA/VFU/{idVFU} (Permette aggiornamento di un veicolo con richiesta di integrazione per riassegnazione a STA)
Request: /rvfu/sh/cr/riassegnazioneVFUaSTA/VFU/30001
{
}
Response:
{
    "result": {
        "idVFU": 30001,
        "tipoVeicolo": "A",
        "targa": "VA311AA",
        "telaio": "WDB2037081A565940",
        "destinazioneVeicolo": "A",
        "tipoUtilizzoVeicolo": "0",
        "fabbrica": "DAIMLERCHRYSLER AGMB203CL R80CF0TCABA401",
        "obbligoIscrizionePRA": "S",
        "dataRitiro": "2024-01-10T00:00:00",
        "dataRegistrazione": "2024-01-10T11:28:57",
        "codiceFiscaleRitiro": "02136780984",
        "matricolaRegistrazione": "CNMI000103",
        "dataConferimento": "2024-01-10T15:36:49",
        "codiceFiscaleConferimento": "02018850061",
        "matricolaConferimento": "CNMI000103",
        "dataPresaInCarico": "2024-01-10T16:11:22",
        "flagArchivioProvenienza": null,
        "flagConsegnaForzeOrdine": "N",
        "codiceFiscaleTrasferimento": null,
        "dataDemolizione": null,
        "dataDistruzioneTarga": null,
        "numeroTargheDistrutte": null,
        "dataDistruzioneDocumenti": null,
        "flagTipoRegime": "2",
        "codiceAgenziaSTA": "AG2096",
        "dataCancellazioneArchivi": null,
        "dataUltimoAggiornamento": "2024-01-31T14:27:59",
        "noteAggiuntive": "prova, motivo integrazione motivo 1",
        "matricolaAggiornamento": "DETO000101",
        "motivoEliminazione": null,
        "motivoTrasferimento": null,
        "dataNotificaInoltroSTA": "2024-01-18T17:21:12",
        "statoVFU": "INVIATO A STA",
        "dataStatoVFU": "2024-01-31T14:27:59",
        "intestatario": {
            "idSoggetto": 29001,
            "idVFU": 30001,
            "tipoSoggetto": "Intestatario",
            "nome": "MARCO",
            "cognome": "VITA",
            "codiceFiscale": "VTIMRC64H23H501F",
            "dataNascita": "1964-06-23T00:00:00",
            "provinciaNascita": null,
            "comuneNascita": null,
            "statoEsteroNascita": null,
            "localitaEsteraNascita": null,
            "provinciaResidenza": null,
            "comuneResidenza": null,
            "toponimoResidenza": null,
            "indirizzoResidenza": "VIA ADDA 2",
            "numeroCivicoResidenza": null,
            "capResidenza": null,
            "statoEsteroResidenza": null,
            "localitaEsteraResidenza": null,
            "tipoPersonaGiuridica": null,
            "ragioneSociale": null,
            "dataInserimento": "2024-01-10T11:28:57",
            "matricolaInserimento": "CNMI000103",
            "matricolaAggiornamento": null,
            "badgeUtenteAggiornamento": null,
            "dataUltimoAggiornamento": "2024-01-10T11:28:57"
        },
        "detentore": null,
        "idCertificato": 164,
        "idRicevuta": null,
        "codiceCertificato": "20240110CD000000014001044",
        "codiceRicevuta": null,
        "dataEmissioneCertificato": "2024-01-10T15:36:49",
        "dataEmissioneRicevuta": null,
        "dataChiusuraFascicolo": "2024-01-31T14:27:46",
        "idFascicolo": 29001,
        "statoFascicolo": "Chiuso",
        "impresaRitiro": {
            "tipoImpresaGestioneVFU": "Concessionario",
            "codiceFiscale": "02136780984",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "provinciaResidenza": "MILANO",
            "tipoSocieta": "SRL"
        },
        "impresaConferimento": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL"
        },
        "impresaTrasferimento": null,
        "agenziaSTA": {
            "codiceAgenzia": "AG2096",
            "denominazione": "ANGILERI FRANCESCO",
            "provinciaSede": "AGRIGENTO",
            "email": "ANGILERIFRANCESCO@LIBERO.IT"
        }
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
GET /rvfu/sh/cr/stampa/VFU (Ritorna il pdf della lista paginata dei veicoli fuori uso visibili al CR)
Request: /rvfu/sh/cr/stampa/VFU?size=10&page=0&obbligoIscrizionePRA=S
Response:
{
    "result": {
        "pdf": "JVBERi0xLjcKJeLjz9MKNSAwIG....OQolJUVPRgo="
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
GET /rvfu/sh/cr/stampaPresaInCarico/VFU (Ritorna il pdf della lista paginata dei veicoli fuori uso da gestire nel processo di presa in carico)
Request: /rvfu/sh/cr/stampaPresaInCarico/VFU?size=10&page=0&obbligoIscrizionePRA=S
Response:
{
    "result": {
        "pdf": "JVBERi0xLjcKJeLjz9MKNSAwI...TcuMS4wCnN0YXJ0eHJlZgoxMzUyMgolJUVPRgo="
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
GET /rvfu/sh/cr/stampaRadiati/VFU (Ritorna il pdf della la lista paginata dei veicoli fuori uso radiati)
Request: /rvfu/sh/cr/stampaRadiati/VFU?size=10&page=0&obbligoIscrizionePRA=N&includiDemoliti=S
Response:
{
    "result": {
        "pdf": "JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PC...nR4cmVmCjEzMDg5CiUlRU9GCg=="
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
GET /rvfu/sh/cr/stampaRottamazione/VFU (Ritorna il pdf della lista paginata dei veicoli fuori uso da gestire nel processo di rottamazione)
Request: /rvfu/sh/cr/stampaRottamazione/VFU?size=10&page=0&obbligoIscrizionePRA=S
Response:
{
    "result": {
        "pdf": "JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PC9GaWx0ZXIvR....R4cmVmCjE0MTE1CiUlRU9GCg=="
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
GET /rvfu/sh/cr/storico/VFU (Ritorna lo storico del veicolo fuori uso cercato visibile al CR)
Request: /rvfu/sh/cr/storico/VFU?size=5&page=1&tipoVeicolo=A&targa=VA320AAS
Response:
{
    "result": {
        "recordCorrente": {
            "idVFU": 22001,
            "tipoVeicolo": "A",
            "targa": "VA320AA",
            "telaio": "WVWZZZ1JZ1W537734",
            "destinazioneVeicolo": "A",
            "tipoUtilizzoVeicolo": "0",
            "fabbrica": "VW 1J STAZDX01 SGFM52K028M41N10GG  BORA ST",
            "obbligoIscrizionePRA": "S",
            "dataRitiro": "2023-11-20T00:00:00",
            "dataRegistrazione": "2023-11-21T10:58:56",
            "codiceFiscaleRitiro": "02018850061",
            "matricolaRegistrazione": "DETO000101",
            "dataConferimento": "2023-11-21T10:58:56",
            "codiceFiscaleConferimento": "02018850061",
            "matricolaConferimento": "DETO000101",
            "dataPresaInCarico": "2023-11-21T10:58:56",
            "flagArchivioProvenienza": null,
            "flagConsegnaForzeOrdine": "N",
            "codiceFiscaleTrasferimento": null,
            "dataDemolizione": null,
            "dataDistruzioneTarga": null,
            "numeroTargheDistrutte": null,
            "dataDistruzioneDocumenti": null,
            "flagTipoRegime": "2",
            "codiceAgenziaSTA": "AG2096",
            "dataCancellazioneArchivi": null,
            "dataUltimoAggiornamento": "2024-01-24T15:14:37",
            "noteAggiuntive": "prova",
            "matricolaAggiornamento": "DETO000101",
            "motivoEliminazione": null,
            "motivoTrasferimento": null,
            "dataNotificaInoltroSTA": "2023-12-22T16:21:25",
            "statoVFU": "INVIATO A STA",
            "dataStatoVFU": "2024-01-24T15:14:37",
            "intestatario": {
                "idSoggetto": 21001,
                "idVFU": 22001,
                "tipoSoggetto": "Intestatario",
                "nome": "MARCO",
                "cognome": "VITA",
                "codiceFiscale": "VTIMRC64H23H501F",
                "dataNascita": "1964-06-23T00:00:00",
                "provinciaNascita": null,
                "comuneNascita": null,
                "statoEsteroNascita": null,
                "localitaEsteraNascita": null,
                "provinciaResidenza": null,
                "comuneResidenza": null,
                "toponimoResidenza": null,
                "indirizzoResidenza": "VIA ADDA 2",
                "numeroCivicoResidenza": null,
                "capResidenza": null,
                "statoEsteroResidenza": null,
                "localitaEsteraResidenza": null,
                "tipoPersonaGiuridica": null,
                "ragioneSociale": null,
                "dataInserimento": "2023-11-21T10:58:56",
                "matricolaInserimento": "DETO000101",
                "matricolaAggiornamento": null,
                "badgeUtenteAggiornamento": null,
                "dataUltimoAggiornamento": "2023-11-21T10:58:56"
            },
            "detentore": null,
            "idCertificato": 142,
            "idRicevuta": null,
            "codiceCertificato": "20231121CD000000070000040",
            "codiceRicevuta": null,
            "dataEmissioneCertificato": "2023-11-21T10:59:28",
            "dataEmissioneRicevuta": null,
            "dataChiusuraFascicolo": "2023-11-21T11:01:04",
            "idFascicolo": 21001,
            "statoFascicolo": "Chiuso",
            "impresaRitiro": {
                "tipoImpresaGestioneVFU": "Centro Raccolta",
                "codiceFiscale": "02018850061",
                "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
                "provinciaResidenza": "BARI",
                "tipoSocieta": "SRL"
            },
            "impresaConferimento": {
                "tipoImpresaGestioneVFU": "Centro Raccolta",
                "codiceFiscale": "02018850061",
                "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
                "provinciaResidenza": "BARI",
                "tipoSocieta": "SRL"
            },
            "impresaTrasferimento": null,
            "agenziaSTA": {
                "codiceAgenzia": "AG2096",
                "denominazione": "ANGILERI FRANCESCO",
                "provinciaSede": "AGRIGENTO",
                "email": "ANGILERIFRANCESCO@LIBERO.IT"
            }
        },
        "pageRecordStorico": {
            "content": [
                {
                    "idVFU": 22001,
                    "tipoVeicolo": "A",
                    "targa": "VA320AA",
                    "telaio": "WVWZZZ1JZ1W537734",
                    "destinazioneVeicolo": "A",
                    "tipoUtilizzoVeicolo": "0",
                    "fabbrica": "VW 1J STAZDX01 SGFM52K028M41N10GG  BORA ST",
                    "obbligoIscrizionePRA": "S",
                    "dataRitiro": "2023-11-20T00:00:00",
                    "dataRegistrazione": "2023-11-21T10:58:56",
                    "codiceFiscaleRitiro": "02018850061",
                    "matricolaRegistrazione": "DETO000101",
                    "dataConferimento": "2023-11-21T10:58:56",
                    "codiceFiscaleConferimento": "02018850061",
                    "matricolaConferimento": "DETO000101",
                    "dataPresaInCarico": "2023-11-21T10:58:56",
                    "flagArchivioProvenienza": null,
                    "flagConsegnaForzeOrdine": "N",
                    "codiceFiscaleTrasferimento": null,
                    "dataDemolizione": null,
                    "dataDistruzioneTarga": null,
                    "numeroTargheDistrutte": null,
                    "dataDistruzioneDocumenti": null,
                    "flagTipoRegime": "2",
                    "codiceAgenziaSTA": null,
                    "dataCancellazioneArchivi": null,
                    "dataUltimoAggiornamento": "2023-12-22T10:18:03",
                    "noteAggiuntive": "prova",
                    "matricolaAggiornamento": "DETO000101",
                    "motivoEliminazione": null,
                    "motivoTrasferimento": null,
                    "dataNotificaInoltroSTA": "2023-12-22T10:18:03",
                    "statoVFU": "DA RADIARE",
                    "dataStatoVFU": "2023-12-22T10:18:03",
                    "intestatario": null,
                    "detentore": null,
                    "idCertificato": null,
                    "idRicevuta": null,
                    "codiceCertificato": null,
                    "codiceRicevuta": null,
                    "dataEmissioneCertificato": null,
                    "dataEmissioneRicevuta": null,
                    "dataChiusuraFascicolo": null,
                    "idFascicolo": null,
                    "statoFascicolo": null,
                    "impresaRitiro": null,
                    "impresaConferimento": null,
                    "impresaTrasferimento": null,
                    "agenziaSTA": null
                },
                {
                    "idVFU": 22001,
                    "tipoVeicolo": "A",
                    "targa": "VA320AA",
                    "telaio": "WVWZZZ1JZ1W537734",
                    "destinazioneVeicolo": "A",
                    "tipoUtilizzoVeicolo": "0",
                    "fabbrica": "VW 1J STAZDX01 SGFM52K028M41N10GG  BORA ST",
                    "obbligoIscrizionePRA": "S",
                    "dataRitiro": "2023-11-20T00:00:00",
                    "dataRegistrazione": "2023-11-21T10:58:56",
                    "codiceFiscaleRitiro": "02018850061",
                    "matricolaRegistrazione": "DETO000101",
                    "dataConferimento": "2023-11-21T10:58:56",
                    "codiceFiscaleConferimento": "02018850061",
                    "matricolaConferimento": "DETO000101",
                    "dataPresaInCarico": "2023-11-21T10:58:56",
                    "flagArchivioProvenienza": null,
                    "flagConsegnaForzeOrdine": "N",
                    "codiceFiscaleTrasferimento": null,
                    "dataDemolizione": null,
                    "dataDistruzioneTarga": null,
                    "numeroTargheDistrutte": null,
                    "dataDistruzioneDocumenti": null,
                    "flagTipoRegime": "2",
                    "codiceAgenziaSTA": "AG2096",
                    "dataCancellazioneArchivi": null,
                    "dataUltimoAggiornamento": "2023-12-22T08:53:48",
                    "noteAggiuntive": "prova",
                    "matricolaAggiornamento": "DETO000101",
                    "motivoEliminazione": null,
                    "motivoTrasferimento": null,
                    "dataNotificaInoltroSTA": "2023-12-22T08:53:48",
                    "statoVFU": "DA RADIARE",
                    "dataStatoVFU": "2023-12-22T08:53:48",
                    "intestatario": null,
                    "detentore": null,
                    "idCertificato": null,
                    "idRicevuta": null,
                    "codiceCertificato": null,
                    "codiceRicevuta": null,
                    "dataEmissioneCertificato": null,
                    "dataEmissioneRicevuta": null,
                    "dataChiusuraFascicolo": null,
                    "idFascicolo": null,
                    "statoFascicolo": null,
                    "impresaRitiro": null,
                    "impresaConferimento": null,
                    "impresaTrasferimento": null,
                    "agenziaSTA": null
                },
                {
                    "idVFU": 22001,
                    "tipoVeicolo": "A",
                    "targa": "VA320AA",
                    "telaio": "WVWZZZ1JZ1W537734",
                    "destinazioneVeicolo": "A",
                    "tipoUtilizzoVeicolo": "0",
                    "fabbrica": "VW 1J STAZDX01 SGFM52K028M41N10GG  BORA ST",
                    "obbligoIscrizionePRA": "S",
                    "dataRitiro": "2023-11-20T00:00:00",
                    "dataRegistrazione": "2023-11-21T10:58:56",
                    "codiceFiscaleRitiro": "02018850061",
                    "matricolaRegistrazione": "DETO000101",
                    "dataConferimento": "2023-11-21T10:58:56",
                    "codiceFiscaleConferimento": "02018850061",
                    "matricolaConferimento": "DETO000101",
                    "dataPresaInCarico": "2023-11-21T10:58:56",
                    "flagArchivioProvenienza": null,
                    "flagConsegnaForzeOrdine": "N",
                    "codiceFiscaleTrasferimento": null,
                    "dataDemolizione": null,
                    "dataDistruzioneTarga": null,
                    "numeroTargheDistrutte": null,
                    "dataDistruzioneDocumenti": null,
                    "flagTipoRegime": "2",
                    "codiceAgenziaSTA": "AG2096",
                    "dataCancellazioneArchivi": null,
                    "dataUltimoAggiornamento": "2023-12-22T08:47:17",
                    "noteAggiuntive": "prova",
                    "matricolaAggiornamento": "DETO000101",
                    "motivoEliminazione": null,
                    "motivoTrasferimento": null,
                    "dataNotificaInoltroSTA": "2023-12-22T08:47:17",
                    "statoVFU": "DA RADIARE",
                    "dataStatoVFU": "2023-12-22T08:47:17",
                    "intestatario": null,
                    "detentore": null,
                    "idCertificato": null,
                    "idRicevuta": null,
                    "codiceCertificato": null,
                    "codiceRicevuta": null,
                    "dataEmissioneCertificato": null,
                    "dataEmissioneRicevuta": null,
                    "dataChiusuraFascicolo": null,
                    "idFascicolo": null,
                    "statoFascicolo": null,
                    "impresaRitiro": null,
                    "impresaConferimento": null,
                    "impresaTrasferimento": null,
                    "agenziaSTA": null
                },
                {
                    "idVFU": 22001,
                    "tipoVeicolo": "A",
                    "targa": "VA320AA",
                    "telaio": "WVWZZZ1JZ1W537734",
                    "destinazioneVeicolo": "A",
                    "tipoUtilizzoVeicolo": "0",
                    "fabbrica": "VW 1J STAZDX01 SGFM52K028M41N10GG  BORA ST",
                    "obbligoIscrizionePRA": "S",
                    "dataRitiro": "2023-11-20T00:00:00",
                    "dataRegistrazione": "2023-11-21T10:58:56",
                    "codiceFiscaleRitiro": "02018850061",
                    "matricolaRegistrazione": "DETO000101",
                    "dataConferimento": "2023-11-21T10:58:56",
                    "codiceFiscaleConferimento": "02018850061",
                    "matricolaConferimento": "DETO000101",
                    "dataPresaInCarico": "2023-11-21T10:58:56",
                    "flagArchivioProvenienza": null,
                    "flagConsegnaForzeOrdine": "N",
                    "codiceFiscaleTrasferimento": null,
                    "dataDemolizione": null,
                    "dataDistruzioneTarga": null,
                    "numeroTargheDistrutte": null,
                    "dataDistruzioneDocumenti": null,
                    "flagTipoRegime": "2",
                    "codiceAgenziaSTA": null,
                    "dataCancellazioneArchivi": null,
                    "dataUltimoAggiornamento": "2023-12-20T13:05:15",
                    "noteAggiuntive": "prova",
                    "matricolaAggiornamento": "DETO000101",
                    "motivoEliminazione": null,
                    "motivoTrasferimento": null,
                    "dataNotificaInoltroSTA": "2023-12-20T13:05:15",
                    "statoVFU": "DA RADIARE",
                    "dataStatoVFU": "2023-12-20T13:05:15",
                    "intestatario": null,
                    "detentore": null,
                    "idCertificato": null,
                    "idRicevuta": null,
                    "codiceCertificato": null,
                    "codiceRicevuta": null,
                    "dataEmissioneCertificato": null,
                    "dataEmissioneRicevuta": null,
                    "dataChiusuraFascicolo": null,
                    "idFascicolo": null,
                    "statoFascicolo": null,
                    "impresaRitiro": null,
                    "impresaConferimento": null,
                    "impresaTrasferimento": null,
                    "agenziaSTA": null
                },
                {
                    "idVFU": 22001,
                    "tipoVeicolo": "A",
                    "targa": "VA320AA",
                    "telaio": "WVWZZZ1JZ1W537734",
                    "destinazioneVeicolo": "A",
                    "tipoUtilizzoVeicolo": "0",
                    "fabbrica": "VW 1J STAZDX01 SGFM52K028M41N10GG  BORA ST",
                    "obbligoIscrizionePRA": "S",
                    "dataRitiro": "2023-11-20T00:00:00",
                    "dataRegistrazione": "2023-11-21T10:58:56",
                    "codiceFiscaleRitiro": "02018850061",
                    "matricolaRegistrazione": "DETO000101",
                    "dataConferimento": "2023-11-21T10:58:56",
                    "codiceFiscaleConferimento": "02018850061",
                    "matricolaConferimento": "DETO000101",
                    "dataPresaInCarico": "2023-11-21T10:58:56",
                    "flagArchivioProvenienza": null,
                    "flagConsegnaForzeOrdine": "N",
                    "codiceFiscaleTrasferimento": null,
                    "dataDemolizione": null,
                    "dataDistruzioneTarga": null,
                    "numeroTargheDistrutte": null,
                    "dataDistruzioneDocumenti": null,
                    "flagTipoRegime": "2",
                    "codiceAgenziaSTA": "RM1321",
                    "dataCancellazioneArchivi": null,
                    "dataUltimoAggiornamento": "2023-12-18T09:43:29",
                    "noteAggiuntive": "prova",
                    "matricolaAggiornamento": "DETO000101",
                    "motivoEliminazione": null,
                    "motivoTrasferimento": null,
                    "dataNotificaInoltroSTA": "2023-11-21T11:01:22",
                    "statoVFU": "DA RADIARE",
                    "dataStatoVFU": "2023-12-18T09:43:29",
                    "intestatario": null,
                    "detentore": null,
                    "idCertificato": null,
                    "idRicevuta": null,
                    "codiceCertificato": null,
                    "codiceRicevuta": null,
                    "dataEmissioneCertificato": null,
                    "dataEmissioneRicevuta": null,
                    "dataChiusuraFascicolo": null,
                    "idFascicolo": null,
                    "statoFascicolo": null,
                    "impresaRitiro": null,
                    "impresaConferimento": null,
                    "impresaTrasferimento": null,
                    "agenziaSTA": null
                }
            ],
            "pageable": {
                "sort": {
                    "sorted": false,
                    "unsorted": true,
                    "empty": true
                },
                "offset": 5,
                "pageNumber": 1,
                "pageSize": 5,
                "paged": true,
                "unpaged": false
            },
            "totalElements": 14,
            "totalPages": 3,
            "last": false,
            "size": 5,
            "number": 1,
            "sort": {
                "sorted": false,
                "unsorted": true,
                "empty": true
            },
            "first": false,
            "numberOfElements": 5,
            "empty": false
        }
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
 
PUT /rvfu/sh/cr/trasferisci/VFU/{idVFU} (Permette il trasferimento di un veicolo fuori uso ad un altro CR)
Request:
https://c-api.servizipdt.it/demolitori-aci-ws/rest/cr/trasferisci/VFU/59002
{
      codiceFiscale: "12345678903"
      motivoTrasferimento: "aaa"
      sedeImpresa: "RMAG0003"
}

Response:
{
    "result": {
        "idVFU": 59002,
        "tipoVeicolo": "T",
        "targa": "AG004553",
        "telaio": "11705",
        "destinazioneVeicolo": null,
        "tipoUtilizzoVeicolo": null,
        "fabbrica": "DEIDONE' B 32 DR",
        "obbligoIscrizionePRA": "N",
        "dataRitiro": "2024-03-04T00:00:00",
        "dataRegistrazione": "2024-03-04T10:51:02",
        "codiceFiscaleRitiro": "02018850061",
        "matricolaSedeRitiro": "TODE0001",
        "indirizzoRitiro": null,
        "matricolaRegistrazione": "DETO000101",
        "dataConferimento": "2024-03-04T10:51:02",
        "codiceFiscaleConferimento": "02018850061",
        "matricolaSedeConferimento": "TODE0001",
        "matricolaConferimento": "DETO000101",
        "indirizzoConferimento": null,
        "dataPresaInCarico": "2024-03-04T10:51:02",
        "flagArchivioProvenienza": null,
        "flagConsegnaForzeOrdine": "N",
        "codiceFiscaleTrasferimento": "12345678903",
        "matricolaSedeTrasferimento": "RMAG0003",
        "indirizzoTrasferimento": null,
        "dataDemolizione": null,
        "dataDistruzioneTarga": null,
        "numeroTargheDistrutte": null,
        "dataDistruzioneDocumenti": null,
        "flagTipoRegime": "1",
        "codiceAgenziaSTA": null,
        "dataCancellazioneArchivi": null,
        "dataUltimoAggiornamento": "2024-03-07T12:00:17",
        "noteAggiuntive": null,
        "matricolaAggiornamento": "DETO000101",
        "motivoEliminazione": null,
        "motivoTrasferimento": "aaa",
        "dataNotificaInoltroSTA": null,
        "statoVFU": "TRASFERITO a 12345678903",
        "dataStatoVFU": "2024-03-07T12:00:17",
        "intestatario": {
            "idSoggetto": 58002,
            "idVFU": 59002,
            "tipoSoggetto": "Intestatario inserito manualmente",
            "nome": "MARCO",
            "cognome": "PIPPO",
            "codiceFiscale": "FPRTRA91C22C349R",
            "dataNascita": "2024-02-26T00:00:00",
            "provinciaNascita": null,
            "comuneNascita": null,
            "statoEsteroNascita": null,
            "localitaEsteraNascita": null,
            "provinciaResidenza": {
                "codice": "058",
                "denominazione": "ROMA",
                "sigla": "RM"
            },
            "comuneResidenza": {
                "codice": "091",
                "denominazione": "ROMA"
            },
            "toponimoResidenza": null,
            "indirizzoResidenza": "VIA ROMA",
            "numeroCivicoResidenza": null,
            "capResidenza": "00100",
            "statoEsteroResidenza": null,
            "localitaEsteraResidenza": null,
            "tipoPersonaGiuridica": null,
            "ragioneSociale": null,
            "dataInserimento": "2024-03-04T10:51:02",
            "matricolaInserimento": "DETO000101",
            "matricolaAggiornamento": null,
            "badgeUtenteAggiornamento": null,
            "dataUltimoAggiornamento": "2024-03-04T10:51:02"
        },
        "detentore": null,
        "idCertificato": 273,
        "idRicevuta": 9241,
        "codiceCertificato": "20240304CD000000006000040",
        "codiceRicevuta": "20240304RC000000004000040",
        "dataEmissioneCertificato": "2024-03-04T12:05:19",
        "dataEmissioneRicevuta": "2024-03-04T00:00:00",
        "dataChiusuraFascicolo": null,
        "idFascicolo": 58002,
        "statoFascicolo": "Inserito",
        "impresaRitiro": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "matricolaSede": "TODE0001",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "comuneResidenza": "BITRITTO",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL",
            "toponimoResidenza": "",
            "indirizzoResidenza": "STRADA STATALE 271 KM.8,680",
            "civicoResidenza": "",
            "indirizzoSede": " STRADA STATALE 271 KM.8,680 "
        },
        "impresaConferimento": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "matricolaSede": "TODE0001",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "comuneResidenza": "BITRITTO",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL",
            "toponimoResidenza": "",
            "indirizzoResidenza": "STRADA STATALE 271 KM.8,680",
            "civicoResidenza": "",
            "indirizzoSede": " STRADA STATALE 271 KM.8,680 "
        },
        "impresaTrasferimento": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "12345678903",
            "matricolaSede": "RMAG0003",
            "denominazioneSociale": "PRAV INVIO",
            "comuneResidenza": "ROMA",
            "provinciaResidenza": "ROMA",
            "tipoSocieta": "SRL",
            "toponimoResidenza": "",
            "indirizzoResidenza": "VI TEST",
            "civicoResidenza": "1",
            "indirizzoSede": " VI TEST 1"
        },
        "agenziaSTA": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}

Lunghezza campi string nella Request (dei campi obbligatori e facoltativi):
codiceFiscale (min=1, max=16)
sedeImpresa (min=1, max=8)
motivoTrasferimento (min=1, max=600)

Campi obbligatori:
codiceFiscale
sedeImpresa
motivoTrasferimento


PUT /rvfu/sh/cr/verifica/VFU/{idVFU}/{causale} (Permette la verifica di un veicolo fuori uso)
Request: /rvfu/sh/cr/verifica/VFU/36001/D
{
}
Response:
{
    "result": {
        "idVFU": 36001,
        "tipoVeicolo": "T",
        "targa": "AG004552",
        "telaio": "0419",
        "destinazioneVeicolo": null,
        "tipoUtilizzoVeicolo": null,
        "fabbrica": "FERRUZZA PT 40",
        "obbligoIscrizionePRA": "N",
        "dataRitiro": "2024-01-25T00:00:00",
        "dataRegistrazione": "2024-01-26T09:42:58",
        "codiceFiscaleRitiro": "02018850061",
        "matricolaRegistrazione": "DETO000101",
        "dataConferimento": "2024-01-26T09:42:58",
        "codiceFiscaleConferimento": "02018850061",
        "matricolaConferimento": "DETO000101",
        "dataPresaInCarico": "2024-01-26T09:42:58",
        "flagArchivioProvenienza": null,
        "flagConsegnaForzeOrdine": "N",
        "codiceFiscaleTrasferimento": null,
        "dataDemolizione": null,
        "dataDistruzioneTarga": null,
        "numeroTargheDistrutte": null,
        "dataDistruzioneDocumenti": null,
        "flagTipoRegime": "1",
        "codiceAgenziaSTA": null,
        "dataCancellazioneArchivi": null,
        "dataUltimoAggiornamento": "2024-01-29T14:10:00",
        "noteAggiuntive": null,
        "matricolaAggiornamento": "DETO000101",
        "motivoEliminazione": null,
        "motivoTrasferimento": null,
        "dataNotificaInoltroSTA": null,
        "statoVFU": "VALIDATO",
        "dataStatoVFU": "2024-01-29T14:10:00",
        "intestatario": {
            "idSoggetto": 35001,
            "idVFU": 36001,
            "tipoSoggetto": "Intestatario inserito manualmente",
            "nome": "MARCO",
            "cognome": "ROSSI",
            "codiceFiscale": "FRRPLA92A22C349S",
            "dataNascita": "2024-01-26T00:00:00",
            "provinciaNascita": null,
            "comuneNascita": null,
            "statoEsteroNascita": null,
            "localitaEsteraNascita": null,
            "provinciaResidenza": {
                "codice": "070",
                "denominazione": "CAMPOBASSO",
                "sigla": "CB"
            },
            "comuneResidenza": {
                "codice": "018",
                "denominazione": "CERCEPICCOLA"
            },
            "toponimoResidenza": null,
            "indirizzoResidenza": "VIA PO",
            "numeroCivicoResidenza": null,
            "capResidenza": "87100",
            "statoEsteroResidenza": null,
            "localitaEsteraResidenza": null,
            "tipoPersonaGiuridica": null,
            "ragioneSociale": null,
            "dataInserimento": "2024-01-26T09:43:00",
            "matricolaInserimento": "DETO000101",
            "matricolaAggiornamento": null,
            "badgeUtenteAggiornamento": null,
            "dataUltimoAggiornamento": "2024-01-26T09:43:00"
        },
        "detentore": null,
        "idCertificato": 174,
        "idRicevuta": 173,
        "codiceCertificato": "20240126CD000000027000040",
        "codiceRicevuta": "20240126RD000000026000040",
        "dataEmissioneCertificato": "2024-01-26T09:43:21",
        "dataEmissioneRicevuta": "2024-01-26T09:43:16",
        "dataChiusuraFascicolo": null,
        "idFascicolo": 35001,
        "statoFascicolo": "Inserito",
        "impresaRitiro": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL"
        },
        "impresaConferimento": {
            "tipoImpresaGestioneVFU": "Centro Raccolta",
            "codiceFiscale": "02018850061",
            "denominazioneSociale": "ENTERPRISE SERVICES ITALIA S.R.L.",
            "provinciaResidenza": "BARI",
            "tipoSocieta": "SRL"
        },
        "impresaTrasferimento": null,
        "agenziaSTA": null
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
Utility
GET /rvfu/sh/utility/detail/utente (Ritorna il dettaglio dell'utente che sta effettuando la richiesta)
Request: /rvfu/sh/utility/detail/utente/
Response:
{
    "result": {
        "codiceFiscaleImpresa": "02018850061",
        "matricola": "DETO000101",
        "desc": "null null",
        "profili": [
            "151",
            "6140"
        ]
    },
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
GET /rvfu/sh/utility/provincia (Ritorna la lista delle province in corso di validità)
Request: /rvfu/sh/utility/provincia
Response:
{
    "result": [
        {
            "codice": "084",
            "denominazione": "AGRIGENTO",
            "sigla": "AG"
        },
        {
            "codice": "006",
            "denominazione": "ALESSANDRIA",
            "sigla": "AL"
        },
        {
            "codice": "042",
            "denominazione": "ANCONA",
            "sigla": "AN"
        },
        {
            "codice": "007",
            "denominazione": "AOSTA",
            "sigla": "AO"
        },
        {
            "codice": "051",
            "denominazione": "AREZZO",
            "sigla": "AR"
        },
        {
            "codice": "044",
            "denominazione": "ASCOLI PICENO",
            "sigla": "AP"
        },
        {
            "codice": "005",
            "denominazione": "ASTI",
            "sigla": "AT"
        },
        {
            "codice": "064",
            "denominazione": "AVELLINO",
            "sigla": "AV"
        },
        {
            "codice": "072",
            "denominazione": "BARI",
            "sigla": "BA"
        },
        {
            "codice": "110",
            "denominazione": "BARLETTA-ANDRIA-TRANI",
            "sigla": "BT"
        },
        {
            "codice": "025",
            "denominazione": "BELLUNO",
            "sigla": "BL"
        },
        {
            "codice": "062",
            "denominazione": "BENEVENTO",
            "sigla": "BN"
        },
        {
            "codice": "016",
            "denominazione": "BERGAMO",
            "sigla": "BG"
        },
        {
            "codice": "096",
            "denominazione": "BIELLA",
            "sigla": "BI"
        },
        {
            "codice": "037",
            "denominazione": "BOLOGNA",
            "sigla": "BO"
        },
        {
            "codice": "021",
            "denominazione": "BOLZANO-BOZEN",
            "sigla": "BZ"
        },
        {
            "codice": "017",
            "denominazione": "BRESCIA",
            "sigla": "BS"
        },
        {
            "codice": "074",
            "denominazione": "BRINDISI",
            "sigla": "BR"
        },
        {
            "codice": "092",
            "denominazione": "CAGLIARI",
            "sigla": "CA"
        },
        {
            "codice": "085",
            "denominazione": "CALTANISSETTA",
            "sigla": "CL"
        },
        {
            "codice": "070",
            "denominazione": "CAMPOBASSO",
            "sigla": "CB"
        },
        {
            "codice": "061",
            "denominazione": "CASERTA",
            "sigla": "CE"
        },
        {
            "codice": "087",
            "denominazione": "CATANIA",
            "sigla": "CT"
        },
        {
            "codice": "079",
            "denominazione": "CATANZARO",
            "sigla": "CZ"
        },
        {
            "codice": "069",
            "denominazione": "CHIETI",
            "sigla": "CH"
        },
        {
            "codice": "013",
            "denominazione": "COMO",
            "sigla": "CO"
        },
        {
            "codice": "078",
            "denominazione": "COSENZA",
            "sigla": "CS"
        },
        {
            "codice": "019",
            "denominazione": "CREMONA",
            "sigla": "CR"
        },
        {
            "codice": "101",
            "denominazione": "CROTONE",
            "sigla": "KR"
        },
        {
            "codice": "004",
            "denominazione": "CUNEO",
            "sigla": "CN"
        },
        {
            "codice": "086",
            "denominazione": "ENNA",
            "sigla": "EN"
        },
        {
            "codice": "109",
            "denominazione": "FERMO",
            "sigla": "FM"
        },
        {
            "codice": "038",
            "denominazione": "FERRARA",
            "sigla": "FE"
        },
        {
            "codice": "048",
            "denominazione": "FIRENZE",
            "sigla": "FI"
        },
        {
            "codice": "071",
            "denominazione": "FOGGIA",
            "sigla": "FG"
        },
        {
            "codice": "040",
            "denominazione": "FORLI'",
            "sigla": "FO"
        },
        {
            "codice": "060",
            "denominazione": "FROSINONE",
            "sigla": "FR"
        },
        {
            "codice": "010",
            "denominazione": "GENOVA",
            "sigla": "GE"
        },
        {
            "codice": "031",
            "denominazione": "GORIZIA",
            "sigla": "GO"
        },
        {
            "codice": "053",
            "denominazione": "GROSSETO",
            "sigla": "GR"
        },
        {
            "codice": "008",
            "denominazione": "IMPERIA",
            "sigla": "IM"
        },
        {
            "codice": "094",
            "denominazione": "ISERNIA",
            "sigla": "IS"
        },
        {
            "codice": "066",
            "denominazione": "L'AQUILA",
            "sigla": "AQ"
        },
        {
            "codice": "011",
            "denominazione": "LA SPEZIA",
            "sigla": "SP"
        },
        {
            "codice": "059",
            "denominazione": "LATINA",
            "sigla": "LT"
        },
        {
            "codice": "075",
            "denominazione": "LECCE",
            "sigla": "LE"
        },
        {
            "codice": "097",
            "denominazione": "LECCO",
            "sigla": "LC"
        },
        {
            "codice": "049",
            "denominazione": "LIVORNO",
            "sigla": "LI"
        },
        {
            "codice": "098",
            "denominazione": "LODI",
            "sigla": "LO"
        },
        {
            "codice": "046",
            "denominazione": "LUCCA",
            "sigla": "LU"
        },
        {
            "codice": "043",
            "denominazione": "MACERATA",
            "sigla": "MC"
        },
        {
            "codice": "020",
            "denominazione": "MANTOVA",
            "sigla": "MN"
        },
        {
            "codice": "045",
            "denominazione": "MASSA-CARRARA",
            "sigla": "MS"
        },
        {
            "codice": "077",
            "denominazione": "MATERA",
            "sigla": "MT"
        },
        {
            "codice": "083",
            "denominazione": "MESSINA",
            "sigla": "ME"
        },
        {
            "codice": "015",
            "denominazione": "MILANO",
            "sigla": "MI"
        },
        {
            "codice": "036",
            "denominazione": "MODENA",
            "sigla": "MO"
        },
        {
            "codice": "108",
            "denominazione": "MONZA E DELLA BRIANZA",
            "sigla": "MB"
        },
        {
            "codice": "063",
            "denominazione": "NAPOLI",
            "sigla": "NA"
        },
        {
            "codice": "003",
            "denominazione": "NOVARA",
            "sigla": "NO"
        },
        {
            "codice": "091",
            "denominazione": "NUORO",
            "sigla": "NU"
        },
        {
            "codice": "095",
            "denominazione": "ORISTANO",
            "sigla": "OR"
        },
        {
            "codice": "028",
            "denominazione": "PADOVA",
            "sigla": "PD"
        },
        {
            "codice": "082",
            "denominazione": "PALERMO",
            "sigla": "PA"
        },
        {
            "codice": "034",
            "denominazione": "PARMA",
            "sigla": "PR"
        },
        {
            "codice": "018",
            "denominazione": "PAVIA",
            "sigla": "PV"
        },
        {
            "codice": "054",
            "denominazione": "PERUGIA",
            "sigla": "PG"
        },
        {
            "codice": "041",
            "denominazione": "PESARO",
            "sigla": "PS"
        },
        {
            "codice": "068",
            "denominazione": "PESCARA",
            "sigla": "PE"
        },
        {
            "codice": "033",
            "denominazione": "PIACENZA",
            "sigla": "PC"
        },
        {
            "codice": "050",
            "denominazione": "PISA",
            "sigla": "PI"
        },
        {
            "codice": "047",
            "denominazione": "PISTOIA",
            "sigla": "PT"
        },
        {
            "codice": "093",
            "denominazione": "PORDENONE",
            "sigla": "PN"
        },
        {
            "codice": "076",
            "denominazione": "POTENZA",
            "sigla": "PZ"
        },
        {
            "codice": "100",
            "denominazione": "PRATO",
            "sigla": "PO"
        },
        {
            "codice": "088",
            "denominazione": "RAGUSA",
            "sigla": "RG"
        },
        {
            "codice": "039",
            "denominazione": "RAVENNA",
            "sigla": "RA"
        },
        {
            "codice": "080",
            "denominazione": "REGGIO DI CALABRIA",
            "sigla": "RC"
        },
        {
            "codice": "035",
            "denominazione": "REGGIO NELL'EMILIA",
            "sigla": "RE"
        },
        {
            "codice": "057",
            "denominazione": "RIETI",
            "sigla": "RI"
        },
        {
            "codice": "099",
            "denominazione": "RIMINI",
            "sigla": "RN"
        },
        {
            "codice": "058",
            "denominazione": "ROMA",
            "sigla": "RM"
        },
        {
            "codice": "029",
            "denominazione": "ROVIGO",
            "sigla": "RO"
        },
        {
            "codice": "065",
            "denominazione": "SALERNO",
            "sigla": "SA"
        },
        {
            "codice": "090",
            "denominazione": "SASSARI",
            "sigla": "SS"
        },
        {
            "codice": "009",
            "denominazione": "SAVONA",
            "sigla": "SV"
        },
        {
            "codice": "052",
            "denominazione": "SIENA",
            "sigla": "SI"
        },
        {
            "codice": "089",
            "denominazione": "SIRACUSA",
            "sigla": "SR"
        },
        {
            "codice": "014",
            "denominazione": "SONDRIO",
            "sigla": "SO"
        },
        {
            "codice": "111",
            "denominazione": "SUD SARDEGNA",
            "sigla": "SU"
        },
        {
            "codice": "073",
            "denominazione": "TARANTO",
            "sigla": "TA"
        },
        {
            "codice": "067",
            "denominazione": "TERAMO",
            "sigla": "TE"
        },
        {
            "codice": "055",
            "denominazione": "TERNI",
            "sigla": "TR"
        },
        {
            "codice": "001",
            "denominazione": "TORINO",
            "sigla": "TO"
        },
        {
            "codice": "081",
            "denominazione": "TRAPANI",
            "sigla": "TP"
        },
        {
            "codice": "022",
            "denominazione": "TRENTO",
            "sigla": "TN"
        },
        {
            "codice": "026",
            "denominazione": "TREVISO",
            "sigla": "TV"
        },
        {
            "codice": "032",
            "denominazione": "TRIESTE",
            "sigla": "TS"
        },
        {
            "codice": "030",
            "denominazione": "UDINE",
            "sigla": "UD"
        },
        {
            "codice": "012",
            "denominazione": "VARESE",
            "sigla": "VA"
        },
        {
            "codice": "027",
            "denominazione": "VENEZIA",
            "sigla": "VE"
        },
        {
            "codice": "103",
            "denominazione": "VERBANIA",
            "sigla": "VB"
        },
        {
            "codice": "002",
            "denominazione": "VERCELLI",
            "sigla": "VC"
        },
        {
            "codice": "023",
            "denominazione": "VERONA",
            "sigla": "VR"
        },
        {
            "codice": "102",
            "denominazione": "VIBO VALENTIA",
            "sigla": "VV"
        },
        {
            "codice": "024",
            "denominazione": "VICENZA",
            "sigla": "VI"
        },
        {
            "codice": "056",
            "denominazione": "VITERBO",
            "sigla": "VT"
        }
    ],
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
GET /rvfu/sh/utility/provincia/{codiceIstat}/comune (Ritorna la lista dei comuni in corso di validità)
Request: /rvfu/sh/utility/provincia/037/comune
Response:
{
    "result": [
        {
            "codice": "062",
            "denominazione": "ALTO RENO TERME"
        },
        {
            "codice": "001",
            "denominazione": "ANZOLA DELL'EMILIA"
        },
        {
            "codice": "002",
            "denominazione": "ARGELATO"
        },
        {
            "codice": "003",
            "denominazione": "BARICELLA"
        },
        {
            "codice": "005",
            "denominazione": "BENTIVOGLIO"
        },
        {
            "codice": "006",
            "denominazione": "BOLOGNA"
        },
        {
            "codice": "007",
            "denominazione": "BORGO TOSSIGNANO"
        },
        {
            "codice": "008",
            "denominazione": "BUDRIO"
        },
        {
            "codice": "009",
            "denominazione": "CALDERARA DI RENO"
        },
        {
            "codice": "010",
            "denominazione": "CAMUGNANO"
        },
        {
            "codice": "011",
            "denominazione": "CASALECCHIO DI RENO"
        },
        {
            "codice": "012",
            "denominazione": "CASALFIUMANESE"
        },
        {
            "codice": "013",
            "denominazione": "CASTEL D'AIANO"
        },
        {
            "codice": "014",
            "denominazione": "CASTEL DEL RIO"
        },
        {
            "codice": "015",
            "denominazione": "CASTEL DI CASIO"
        },
        {
            "codice": "016",
            "denominazione": "CASTEL GUELFO BOLOGNA"
        },
        {
            "codice": "019",
            "denominazione": "CASTEL MAGGIORE"
        },
        {
            "codice": "020",
            "denominazione": "CASTEL S.PIETRO TERME"
        },
        {
            "codice": "017",
            "denominazione": "CASTELLO D'ARGILE"
        },
        {
            "codice": "021",
            "denominazione": "CASTENASO"
        },
        {
            "codice": "022",
            "denominazione": "CASTIGLIONE DEI PEPOLI"
        },
        {
            "codice": "024",
            "denominazione": "CREVALCORE"
        },
        {
            "codice": "025",
            "denominazione": "DOZZA"
        },
        {
            "codice": "026",
            "denominazione": "FONTANELICE"
        },
        {
            "codice": "027",
            "denominazione": "GAGGIO MONTANO"
        },
        {
            "codice": "028",
            "denominazione": "GALLIERA"
        },
        {
            "codice": "030",
            "denominazione": "GRANAROLO DELL'EMILIA"
        },
        {
            "codice": "031",
            "denominazione": "GRIZZANA MORANDI"
        },
        {
            "codice": "032",
            "denominazione": "IMOLA"
        },
        {
            "codice": "033",
            "denominazione": "LIZZANO IN BELVEDERE"
        },
        {
            "codice": "034",
            "denominazione": "LOIANO"
        },
        {
            "codice": "035",
            "denominazione": "MALALBERGO"
        },
        {
            "codice": "036",
            "denominazione": "MARZABOTTO"
        },
        {
            "codice": "037",
            "denominazione": "MEDICINA"
        },
        {
            "codice": "038",
            "denominazione": "MINERBIO"
        },
        {
            "codice": "039",
            "denominazione": "MOLINELLA"
        },
        {
            "codice": "040",
            "denominazione": "MONGHIDORO"
        },
        {
            "codice": "042",
            "denominazione": "MONTE SAN PIETRO"
        },
        {
            "codice": "041",
            "denominazione": "MONTERENZIO"
        },
        {
            "codice": "044",
            "denominazione": "MONZUNO"
        },
        {
            "codice": "045",
            "denominazione": "MORDANO"
        },
        {
            "codice": "046",
            "denominazione": "OZZANO DELL'EMILIA"
        },
        {
            "codice": "047",
            "denominazione": "PIANORO"
        },
        {
            "codice": "048",
            "denominazione": "PIEVE DI CENTO"
        },
        {
            "codice": "051",
            "denominazione": "S.BENEDETTO VAL SAMBRO"
        },
        {
            "codice": "050",
            "denominazione": "SALA BOLOGNESE"
        },
        {
            "codice": "052",
            "denominazione": "SAN GIORGIO DI PIANO"
        },
        {
            "codice": "053",
            "denominazione": "SAN GIOVANNI PERSICETO"
        },
        {
            "codice": "054",
            "denominazione": "SAN LAZZARO DI SAVENA"
        },
        {
            "codice": "055",
            "denominazione": "SAN PIETRO IN CASALE"
        },
        {
            "codice": "056",
            "denominazione": "SANT'AGATA BOLOGNESE"
        },
        {
            "codice": "057",
            "denominazione": "SASSO MARCONI"
        },
        {
            "codice": "061",
            "denominazione": "VALSAMOGGIA"
        },
        {
            "codice": "059",
            "denominazione": "VERGATO"
        },
        {
            "codice": "060",
            "denominazione": "ZOLA PREDOSA"
        }
    ],
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}

Causali (CR)
GET /demolitori-aci-ws/rest/cr/causali {causale} Ritorna la lista delle causali
Request: /demolitori-aci-ws/rest/cr/causali
Response:
{
    "result": [
        {
            "transientReference": false,
            "codMtvInsVei": "P",
            "desMtvInsVei": "DEMOLIZIONE SU PROVVEDIMENTO PA",
            "codMneMtvInsVei": "PA",
            "codBadUltAgg": null,
            "datUltAgg": "2024-04-09T10:49:34",
            "id": "P",
            "new": false
        },
        {
            "transientReference": false,
            "codMtvInsVei": "D",
            "desMtvInsVei": "DEMOLIZIONE",
            "codMneMtvInsVei": "SD",
            "codBadUltAgg": null,

            "datUltAgg": "2024-04-09T10:49:34",
            "id": "D",
            "new": false
        },
        {
            "transientReference": false,
            "codMtvInsVei": "V",
            "desMtvInsVei": "VEICOLO NON ISCRITTO/NON RICONOSCIUTO",
            "codMneMtvInsVei": "NN",
            "codBadUltAgg": null,
            "datUltAgg": "2024-04-09T10:49:34",
            "id": "V",
            "new": false
        },

        {
            "transientReference": false,
            "codMtvInsVei": "R",
            "desMtvInsVei": "VEICOLO RADIATO",
            "codMneMtvInsVei": "RD",
            "codBadUltAgg": null,
            "datUltAgg": "2024-04-09T10:49:34",
            "id": "R",
            "new": false
        }
    ],
    "esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
  }
}
CausalePerCodice (CR)
GET /demolitori-aci-ws/rest/cr/causalePerCodice { codMtvInsVei}  Ritorna la causale per codice 
Request: /demolitori-aci-ws/rest/cr/causalePerCodice/P
Response:
{
    "result": {
            "transientReference": false,
            "codMtvInsVei": "P",
            "desMtvInsVei": "DEMOLIZIONE SU PROVVEDIMENTO PA",
            "codMneMtvInsVei": "PA",
            "codBadUltAgg": null,
            "datUltAgg": "2024-04-09T10:49:34",
            "id": "P",
            "new": false
        }		
"esito": {
        "responseStatus": "OK",
        "message": "ELABORAZIONE CORRETTAMENTE ESEGUITA",
        "code": "E000"
    }
}
