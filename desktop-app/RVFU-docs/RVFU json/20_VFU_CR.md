# VFU (CR)

CRVFU Controller

## POST `/demolitori-aci-ws/rest/cr/VFU`
> Permette la registrazione di un veicolo fuori uso
- `operationId`: `inserisciVFUBeanUsingPOST_1`


**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `VFUCreateAsCR` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/VFU/{idVFU}`
> Ritorna il dettaglio di un veicolo fuori uso
- `operationId`: `findOneUsingGET_7`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/VFU/{idVFU}`
> Permette la modifica di un veicolo fuori uso
- `operationId`: `aggiornaVFUBeanUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |

**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `VFUUpdate` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/annulla/VFU/{idVFU}`
> Permette l'annullamento di un veicolo fuori uso
- `operationId`: `annullaVFUUsingPUT_1`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |

**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `VFUElimina` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/annullaInoltroSTA/VFU/{idVFU}`
> Permette di annullare l'inoltro di un veicolo fuori uso ad un'agenzia STA
- `operationId`: `annullaInoltroSTAUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/cedi/VFU/{idVFU}`
> Permette l'assegnazione dello stato ceduto ad un veicolo fuori uso
- `operationId`: `cediVFUUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |

**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `VFUCedi` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/confermaRadiazioneVFU/VFU/{idVFU}`
> Conferma la radiazione di un VFU, cambiando lo stato da 'Da Radiare' a 'Radiato'
- `operationId`: `confermaRadiazioneVFUUsingPUT_1`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFURadiazione` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/consulta/VFU`
> Ritorna la lista paginata dei veicoli fuori uso visibili al CR
- `operationId`: `consultaVFUUsingGET_2`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscaleRitiro` | `query` | false | `string` | `` |  |
| `dataConferimentoA` | `query` | false | `string` | `date-time` |  |
| `dataConferimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTAA` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTADa` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoA` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoDa` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneA` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneDa` | `query` | false | `string` | `date-time` |  |
| `dataRitiroA` | `query` | false | `string` | `date-time` |  |
| `dataRitiroDa` | `query` | false | `string` | `date-time` |  |
| `notePartiRifiuti` | `query` | false | `boolean` | `` |  |
| `obbligoIscrizionePRA` | `query` | false | `string` | `` |  |
| `offset` | `query` | false | `integer` | `int64` |  |
| `pageNumber` | `query` | false | `integer` | `int32` |  |
| `pageSize` | `query` | false | `integer` | `int32` |  |
| `paged` | `query` | false | `boolean` | `` |  |
| `sort.sorted` | `query` | false | `boolean` | `` |  |
| `sort.unsorted` | `query` | false | `boolean` | `` |  |
| `statoVFU` | `query` | false | `string` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |
| `unpaged` | `query` | false | `boolean` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPageOfVFUBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/consultaPresaInCarico/VFU`
> Ritorna la lista paginata dei veicoli fuori uso da gestire nel processo di presa in carico
- `operationId`: `consultaVFUPresaInCaricoUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscaleRitiro` | `query` | false | `string` | `` |  |
| `dataConferimentoA` | `query` | false | `string` | `date-time` |  |
| `dataConferimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTAA` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTADa` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoA` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoDa` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneA` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneDa` | `query` | false | `string` | `date-time` |  |
| `dataRitiroA` | `query` | false | `string` | `date-time` |  |
| `dataRitiroDa` | `query` | false | `string` | `date-time` |  |
| `notePartiRifiuti` | `query` | false | `boolean` | `` |  |
| `obbligoIscrizionePRA` | `query` | false | `string` | `` |  |
| `offset` | `query` | false | `integer` | `int64` |  |
| `pageNumber` | `query` | false | `integer` | `int32` |  |
| `pageSize` | `query` | false | `integer` | `int32` |  |
| `paged` | `query` | false | `boolean` | `` |  |
| `sort.sorted` | `query` | false | `boolean` | `` |  |
| `sort.unsorted` | `query` | false | `boolean` | `` |  |
| `statoVFU` | `query` | false | `string` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |
| `unpaged` | `query` | false | `boolean` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPageOfVFUBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/consultaRadiati/VFU`
> Ritorna la lista paginata dei veicoli fuori uso radiati
- `operationId`: `consultaVFURadiatiUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceAgenziaSTA` | `query` | false | `string` | `` |  |
| `dataConferimentoA` | `query` | false | `string` | `date-time` |  |
| `dataConferimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTAA` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTADa` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoA` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoDa` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneA` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneDa` | `query` | false | `string` | `date-time` |  |
| `dataRitiroA` | `query` | false | `string` | `date-time` |  |
| `dataRitiroDa` | `query` | false | `string` | `date-time` |  |
| `includiDemoliti` | `query` | false | `boolean` | `` |  |
| `notePartiRifiuti` | `query` | false | `boolean` | `` |  |
| `obbligoIscrizionePRA` | `query` | false | `string` | `` |  |
| `offset` | `query` | false | `integer` | `int64` |  |
| `pageNumber` | `query` | false | `integer` | `int32` |  |
| `pageSize` | `query` | false | `integer` | `int32` |  |
| `paged` | `query` | false | `boolean` | `` |  |
| `sort.sorted` | `query` | false | `boolean` | `` |  |
| `sort.unsorted` | `query` | false | `boolean` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |
| `unpaged` | `query` | false | `boolean` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPageOfVFUBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/consultaRichiestaIntegrazione/VFU`
> Ritorna la lista paginata dei veicoli fuori uso da gestire nel processo di Richiesta Integrazione da STA
- `operationId`: `consultaVFURichiestaIntegrazioneUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscaleRitiro` | `query` | false | `string` | `` |  |
| `dataConferimentoA` | `query` | false | `string` | `date-time` |  |
| `dataConferimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTAA` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTADa` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoA` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoDa` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneA` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneDa` | `query` | false | `string` | `date-time` |  |
| `dataRitiroA` | `query` | false | `string` | `date-time` |  |
| `dataRitiroDa` | `query` | false | `string` | `date-time` |  |
| `notePartiRifiuti` | `query` | false | `boolean` | `` |  |
| `obbligoIscrizionePRA` | `query` | false | `string` | `` |  |
| `offset` | `query` | false | `integer` | `int64` |  |
| `pageNumber` | `query` | false | `integer` | `int32` |  |
| `pageSize` | `query` | false | `integer` | `int32` |  |
| `paged` | `query` | false | `boolean` | `` |  |
| `sort.sorted` | `query` | false | `boolean` | `` |  |
| `sort.unsorted` | `query` | false | `boolean` | `` |  |
| `statoVFU` | `query` | false | `string` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |
| `unpaged` | `query` | false | `boolean` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPageOfVFUBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/consultaRottamazione/VFU`
> Ritorna la lista paginata dei veicoli fuori uso da gestire nel processo di rottamazione
- `operationId`: `consultaVFURottamazioneUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscaleRitiro` | `query` | false | `string` | `` |  |
| `dataConferimentoA` | `query` | false | `string` | `date-time` |  |
| `dataConferimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTAA` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTADa` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoA` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoDa` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneA` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneDa` | `query` | false | `string` | `date-time` |  |
| `dataRitiroA` | `query` | false | `string` | `date-time` |  |
| `dataRitiroDa` | `query` | false | `string` | `date-time` |  |
| `notePartiRifiuti` | `query` | false | `boolean` | `` |  |
| `obbligoIscrizionePRA` | `query` | false | `string` | `` |  |
| `offset` | `query` | false | `integer` | `int64` |  |
| `pageNumber` | `query` | false | `integer` | `int32` |  |
| `pageSize` | `query` | false | `integer` | `int32` |  |
| `paged` | `query` | false | `boolean` | `` |  |
| `sort.sorted` | `query` | false | `boolean` | `` |  |
| `sort.unsorted` | `query` | false | `boolean` | `` |  |
| `statoVFU` | `query` | false | `string` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |
| `unpaged` | `query` | false | `boolean` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPageOfVFUBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/demolisci/VFU/{idVFU}`
> Permette l'assegnazione dello stato demolito ad un veicolo fuori uso
- `operationId`: `demolisciVFUUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |

**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `VFUDemolisci` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/export/VFU`
> Esporta il risultato della ricerca in formato xlsx
- `operationId`: `exportVFUUsingGET_2`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscaleRitiro` | `query` | false | `string` | `` |  |
| `dataConferimentoA` | `query` | false | `string` | `date-time` |  |
| `dataConferimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTAA` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTADa` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoA` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoDa` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneA` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneDa` | `query` | false | `string` | `date-time` |  |
| `dataRitiroA` | `query` | false | `string` | `date-time` |  |
| `dataRitiroDa` | `query` | false | `string` | `date-time` |  |
| `notePartiRifiuti` | `query` | false | `boolean` | `` |  |
| `obbligoIscrizionePRA` | `query` | false | `string` | `` |  |
| `statoVFU` | `query` | false | `string` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfXlsxBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/exportPresaInCarico/VFU`
> Esporta il risultato della ricerca dei veicoli fuori uso da gestire nel processo di presa in carico in formato xlsx
- `operationId`: `exportVFUPresaInCaricoUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscaleRitiro` | `query` | false | `string` | `` |  |
| `dataConferimentoA` | `query` | false | `string` | `date-time` |  |
| `dataConferimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTAA` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTADa` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoA` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoDa` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneA` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneDa` | `query` | false | `string` | `date-time` |  |
| `dataRitiroA` | `query` | false | `string` | `date-time` |  |
| `dataRitiroDa` | `query` | false | `string` | `date-time` |  |
| `notePartiRifiuti` | `query` | false | `boolean` | `` |  |
| `obbligoIscrizionePRA` | `query` | false | `string` | `` |  |
| `statoVFU` | `query` | false | `string` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfXlsxBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/exportRadiati/VFU`
> Esporta il risultato della ricerca dei veicoli fuori uso radiati in formato xlsx
- `operationId`: `exportVFURadiatiUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceAgenziaSTA` | `query` | false | `string` | `` |  |
| `dataConferimentoA` | `query` | false | `string` | `date-time` |  |
| `dataConferimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTAA` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTADa` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoA` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoDa` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneA` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneDa` | `query` | false | `string` | `date-time` |  |
| `dataRitiroA` | `query` | false | `string` | `date-time` |  |
| `dataRitiroDa` | `query` | false | `string` | `date-time` |  |
| `includiDemoliti` | `query` | false | `boolean` | `` |  |
| `notePartiRifiuti` | `query` | false | `boolean` | `` |  |
| `obbligoIscrizionePRA` | `query` | false | `string` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfXlsxBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/exportRottamazione/VFU`
> Esporta il risultato della ricerca dei veicoli fuori uso da gestire nel processo di rottamazione in formato xlsx
- `operationId`: `exportVFURottamazioneUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscaleRitiro` | `query` | false | `string` | `` |  |
| `dataConferimentoA` | `query` | false | `string` | `date-time` |  |
| `dataConferimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTAA` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTADa` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoA` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoDa` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneA` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneDa` | `query` | false | `string` | `date-time` |  |
| `dataRitiroA` | `query` | false | `string` | `date-time` |  |
| `dataRitiroDa` | `query` | false | `string` | `date-time` |  |
| `notePartiRifiuti` | `query` | false | `boolean` | `` |  |
| `obbligoIscrizionePRA` | `query` | false | `string` | `` |  |
| `statoVFU` | `query` | false | `string` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfXlsxBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## POST `/demolitori-aci-ws/rest/cr/filtroDatiDU/VFU/{idVFU}/{filterValue}`
> Effettua lo switch del flag che limita i dati anagrafici ritornati in risposta al DU
- `operationId`: `switchFiltroDatiDUUsingPOST`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |
| `filterValue` | `path` | true | `boolean` | `` | filterValue |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/inoltraSTA/VFU/{codiceSTA}`
> Permette l'inoltro di una lista di veicoli fuori uso ad un'agenzia STA
- `operationId`: `inoltraSTAUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceSTA` | `path` | true | `string` | `` | codiceSTA |

**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `array` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfListOfVFUBean` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/prendiInCarico/VFU/{idVFU}`
> Permette la presa in carico di un veicolo fuori uso conferito al CR
- `operationId`: `prendiInCaricoVFUUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |

**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `VFUPrendiInCarico` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/stampa/VFU`
> Ritorna il pdf della lista paginata dei veicoli fuori uso visibili al CR
- `operationId`: `stampaVFUUsingGET_2`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscaleRitiro` | `query` | false | `string` | `` |  |
| `dataConferimentoA` | `query` | false | `string` | `date-time` |  |
| `dataConferimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTAA` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTADa` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoA` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoDa` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneA` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneDa` | `query` | false | `string` | `date-time` |  |
| `dataRitiroA` | `query` | false | `string` | `date-time` |  |
| `dataRitiroDa` | `query` | false | `string` | `date-time` |  |
| `notePartiRifiuti` | `query` | false | `boolean` | `` |  |
| `obbligoIscrizionePRA` | `query` | false | `string` | `` |  |
| `statoVFU` | `query` | false | `string` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPdfBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/stampaPresaInCarico/VFU`
> Ritorna il pdf della lista paginata dei veicoli fuori uso da gestire nel processo di presa in carico
- `operationId`: `stampaVFUPresaInCaricoUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscaleRitiro` | `query` | false | `string` | `` |  |
| `dataConferimentoA` | `query` | false | `string` | `date-time` |  |
| `dataConferimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTAA` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTADa` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoA` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoDa` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneA` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneDa` | `query` | false | `string` | `date-time` |  |
| `dataRitiroA` | `query` | false | `string` | `date-time` |  |
| `dataRitiroDa` | `query` | false | `string` | `date-time` |  |
| `notePartiRifiuti` | `query` | false | `boolean` | `` |  |
| `obbligoIscrizionePRA` | `query` | false | `string` | `` |  |
| `statoVFU` | `query` | false | `string` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPdfBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/stampaRadiati/VFU`
> Ritorna il pdf della la lista paginata dei veicoli fuori uso radiati
- `operationId`: `stampaVFURadiatiUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceAgenziaSTA` | `query` | false | `string` | `` |  |
| `dataConferimentoA` | `query` | false | `string` | `date-time` |  |
| `dataConferimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTAA` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTADa` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoA` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoDa` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneA` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneDa` | `query` | false | `string` | `date-time` |  |
| `dataRitiroA` | `query` | false | `string` | `date-time` |  |
| `dataRitiroDa` | `query` | false | `string` | `date-time` |  |
| `includiDemoliti` | `query` | false | `boolean` | `` |  |
| `notePartiRifiuti` | `query` | false | `boolean` | `` |  |
| `obbligoIscrizionePRA` | `query` | false | `string` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPdfBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/stampaRottamazione/VFU`
> Ritorna il pdf della lista paginata dei veicoli fuori uso da gestire nel processo di rottamazione
- `operationId`: `stampaVFURottamazioneUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscaleRitiro` | `query` | false | `string` | `` |  |
| `dataConferimentoA` | `query` | false | `string` | `date-time` |  |
| `dataConferimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTAA` | `query` | false | `string` | `date-time` |  |
| `dataNotificaInoltroSTADa` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoA` | `query` | false | `string` | `date-time` |  |
| `dataPresaInCaricoDa` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneA` | `query` | false | `string` | `date-time` |  |
| `dataRadiazioneDa` | `query` | false | `string` | `date-time` |  |
| `dataRitiroA` | `query` | false | `string` | `date-time` |  |
| `dataRitiroDa` | `query` | false | `string` | `date-time` |  |
| `notePartiRifiuti` | `query` | false | `boolean` | `` |  |
| `obbligoIscrizionePRA` | `query` | false | `string` | `` |  |
| `statoVFU` | `query` | false | `string` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPdfBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/storico/VFU`
> Ritorna lo storico del veicolo fuori uso cercato visibile al CR
- `operationId`: `findStoricoUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `dataAggiornamentoA` | `query` | false | `string` | `date-time` |  |
| `dataAggiornamentoDa` | `query` | false | `string` | `date-time` |  |
| `obbligoIscrizionePra` | `query` | false | `boolean` | `` |  |
| `offset` | `query` | false | `integer` | `int64` |  |
| `pageNumber` | `query` | false | `integer` | `int32` |  |
| `pageSize` | `query` | false | `integer` | `int32` |  |
| `paged` | `query` | false | `boolean` | `` |  |
| `sort.sorted` | `query` | false | `boolean` | `` |  |
| `sort.unsorted` | `query` | false | `boolean` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `targaOTelaio` | `query` | false | `boolean` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | true | `string` | `` |  |
| `unpaged` | `query` | false | `boolean` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfStoricoVFU` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/trasferisci/VFU/{idVFU}`
> Permette il trasferimento di un veicolo fuori uso ad un altro CR
- `operationId`: `trasferisciVFUUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |

**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `VFUTrasferisci` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/verifica/VFU/{idVFU}/{causale}`
> Permette la verifica di un veicolo fuori uso
- `operationId`: `verificaVFUUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |
| `causale` | `path` | true | `string` | `` | causale |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---
