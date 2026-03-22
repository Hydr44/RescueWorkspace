# VFU (UMC)

UMCVFU Controller

## GET `/demolitori-aci-ws/rest/umc/VFU/{id}`
> Ritorna il dettaglio di un veicolo fuori uso
- `operationId`: `findOneUsingGET_10`

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

## GET `/demolitori-aci-ws/rest/umc/consulta/VFU`
> Ritorna la lista paginata dei veicoli fuori uso
- `operationId`: `consultaVFUUsingGET_3`

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
| `tipo` | `query` | false | `string` | `` |  |
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

## GET `/demolitori-aci-ws/rest/umc/export/VFU`
> Esporta il risultato della ricerca in formato xlsx
- `operationId`: `exportVFUUsingGET_3`

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
| `tipo` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfXlsxBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/umc/stampa/VFU`
> Ritorna il pdf della lista paginata dei veicoli fuori uso
- `operationId`: `stampaVFUUsingGET_3`

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
| `tipo` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | false | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPdfBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/umc/storico/VFU`
> Ritorna lo storico del veicolo fuori uso cercato visibile al CR
- `operationId`: `findStoricoUsingGET_1`

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
