# VFU (Agenzia)

Agenzia VFU Controller

## GET `/demolitori-aci-ws/rest/agenzia/VFU/{id}`
> Ritorna il dettaglio di un veicolo fuori uso visibile all'agenzia
- `operationId`: `findOneUsingGET`

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

## PUT `/demolitori-aci-ws/rest/agenzia/confermaRadiazioneVFU/VFU/{idVFU}`
> Conferma la radiazione di un VFU, cambiando lo stato da 'Assegnato a STA' a 'Radiato'
- `operationId`: `confermaRadiazioneVFUUsingPUT`

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

## GET `/demolitori-aci-ws/rest/agenzia/consulta/VFU`
> Ritorna la lista paginata dei veicoli fuori uso visibili all'agenzia
- `operationId`: `consultaVFUUsingGET`

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

## GET `/demolitori-aci-ws/rest/agenzia/export/VFU`
> Esporta il risultato della ricerca in formato xlsx
- `operationId`: `exportVFUUsingGET`

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

## GET `/demolitori-aci-ws/rest/agenzia/stampa/VFU`
> Ritorna una stampa in PDF del risultato della ricerca
- `operationId`: `stampaVFUUsingGET`

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
