# Delega (UMC)

UMC Delega Controller

## GET `/demolitori-aci-ws/rest/umc/consulta/delega`
> Ritorna la lista paginata delle deleghe
- `operationId`: `consultaDelegheUsingGET_2`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscale` | `query` | false | `string` | `` |  |
| `dataFineA` | `query` | false | `string` | `date-time` |  |
| `dataFineDa` | `query` | false | `string` | `date-time` |  |
| `dataInizioA` | `query` | false | `string` | `date-time` |  |
| `dataInizioDa` | `query` | false | `string` | `date-time` |  |
| `offset` | `query` | false | `integer` | `int64` |  |
| `pageNumber` | `query` | false | `integer` | `int32` |  |
| `pageSize` | `query` | false | `integer` | `int32` |  |
| `paged` | `query` | false | `boolean` | `` |  |
| `sort.sorted` | `query` | false | `boolean` | `` |  |
| `sort.unsorted` | `query` | false | `boolean` | `` |  |
| `statoDelega` | `query` | false | `string` | `` |  |
| `unpaged` | `query` | false | `boolean` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPageOfDelega` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/umc/delega/{idDelega}`
> Ritorna il dettaglio di una delega
- `operationId`: `findOneUsingGET_8`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idDelega` | `path` | true | `integer` | `int64` | idDelega |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDelega` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/umc/stampa/delega`
> Ritorna il pdf della lista paginata delle deleghe
- `operationId`: `stampaDelegheUsingGET_2`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscale` | `query` | false | `string` | `` |  |
| `dataFineA` | `query` | false | `string` | `date-time` |  |
| `dataFineDa` | `query` | false | `string` | `date-time` |  |
| `dataInizioA` | `query` | false | `string` | `date-time` |  |
| `dataInizioDa` | `query` | false | `string` | `date-time` |  |
| `offset` | `query` | false | `integer` | `int64` |  |
| `pageNumber` | `query` | false | `integer` | `int32` |  |
| `pageSize` | `query` | false | `integer` | `int32` |  |
| `paged` | `query` | false | `boolean` | `` |  |
| `sort.sorted` | `query` | false | `boolean` | `` |  |
| `sort.unsorted` | `query` | false | `boolean` | `` |  |
| `statoDelega` | `query` | false | `string` | `` |  |
| `unpaged` | `query` | false | `boolean` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPdfBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---
