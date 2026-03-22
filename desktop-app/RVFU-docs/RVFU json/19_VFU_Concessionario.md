# VFU (Concessionario)

Concessionario VFU Controller

## POST `/demolitori-aci-ws/rest/concessionario/VFU`
> Permette la registrazione di un nuovo veicolo vuori uso
- `operationId`: `inserisciVFUBeanUsingPOST`


**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `VFUCreateAsConcessionario` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/concessionario/VFU/{id}`
> Ritorna il dettaglio di un veicolo fuori uso
- `operationId`: `findOneUsingGET_3`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `id` | `path` | true | `integer` | `int64` | id |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/concessionario/annulla/VFU/{idVFU}`
> Permette l'annullamento di un veicolo fuori uso ritirato e non ancora conferito
- `operationId`: `annullaVFUUsingPUT`

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

## PUT `/demolitori-aci-ws/rest/concessionario/conferisci/VFU/{idVFU}`
> Permette il conferimento di un veicolo fuori uso ad un CR da cui si è stati delegati
- `operationId`: `conferisciVFUBeanUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |

**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `VFUConferisci` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/concessionario/consulta/VFU`
> Ritorna la lista paginata dei VFU visibili al concessionario
- `operationId`: `consultaVFUUsingGET_1`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscaleCR` | `query` | false | `string` | `` |  |
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

## GET `/demolitori-aci-ws/rest/concessionario/export/VFU`
> Esporta il risultato della ricerca in formato xlsx
- `operationId`: `exportVFUUsingGET_1`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscaleCR` | `query` | false | `string` | `` |  |
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

## GET `/demolitori-aci-ws/rest/concessionario/stampa/VFU`
> Ritorna il pdf della lista paginata dei VFU visibili al concessionario
- `operationId`: `stampaVFUUsingGET_1`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscaleCR` | `query` | false | `string` | `` |  |
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
