# Impresa gestione VFU (UMC)

UMC Impresa Gestione VFU Controller

## GET `/demolitori-aci-ws/rest/umc/consulta/impresaGestioneVFU`
> Ritorna la lista paginata delle imprese accreditate
- `operationId`: `consultaImpresaUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `almenoUno` | `query` | false | `boolean` | `` |  |
| `codiceFiscale` | `query` | false | `string` | `` |  |
| `codiceProvincia` | `query` | false | `string` | `` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `offset` | `query` | false | `integer` | `int64` |  |
| `pageNumber` | `query` | false | `integer` | `int32` |  |
| `pageSize` | `query` | false | `integer` | `int32` |  |
| `paged` | `query` | false | `boolean` | `` |  |
| `sort.sorted` | `query` | false | `boolean` | `` |  |
| `sort.unsorted` | `query` | false | `boolean` | `` |  |
| `tipoImpresaGestioneVFU` | `query` | false | `string` | `` |  |
| `unpaged` | `query` | false | `boolean` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPageOfSedeImpresaVfuDtt` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/umc/impresaGestioneVFU/{idImpresa}`
> Ritorna il dettaglio dell'impresa accreditata
- `operationId`: `findOneUsingGET_9`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idImpresa` | `path` | true | `integer` | `int64` | idImpresa |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfSedeImpresaVfuDtt` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/umc/stampa/impresaGestioneVFU`
> Ritorna il pdf della lista paginata delle imprese accreditate
- `operationId`: `stampaImpresaUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `almenoUno` | `query` | false | `boolean` | `` |  |
| `codiceFiscale` | `query` | false | `string` | `` |  |
| `codiceProvincia` | `query` | false | `string` | `` |  |
| `dataInserimentoA` | `query` | false | `string` | `date-time` |  |
| `dataInserimentoDa` | `query` | false | `string` | `date-time` |  |
| `offset` | `query` | false | `integer` | `int64` |  |
| `pageNumber` | `query` | false | `integer` | `int32` |  |
| `pageSize` | `query` | false | `integer` | `int32` |  |
| `paged` | `query` | false | `boolean` | `` |  |
| `sort.sorted` | `query` | false | `boolean` | `` |  |
| `sort.unsorted` | `query` | false | `boolean` | `` |  |
| `tipoImpresaGestioneVFU` | `query` | false | `string` | `` |  |
| `unpaged` | `query` | false | `boolean` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPdfBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/umc/stampa/impresaGestioneVFU/{idImpresa}`
> Ritorna il pdf del dettaglio dell'impresa accreditata
- `operationId`: `stampaOneImpresaUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idImpresa` | `path` | true | `integer` | `int64` | idImpresa |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfPdfBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---
