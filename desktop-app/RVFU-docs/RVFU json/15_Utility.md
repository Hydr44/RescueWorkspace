# Utility

Utility Controller

## GET `/demolitori-aci-ws/rest/utility/comune`
> Ritorna la lista dei comuni rispondenti ai criteri forniti (data nulla equivale a data odierna)
- `operationId`: `findComuniUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `siglaProvincia` | `query` | true | `string` | `` | siglaProvincia |
| `nomeComune` | `query` | false | `string` | `` | nomeComune |
| `data` | `query` | false | `string` | `date` | data |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfListOfComuneIstat` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/utility/detail/utente`
> Ritorna il dettaglio dell'utente che sta effettuando la richiesta
- `operationId`: `detailUtenteUsingGET`



**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfUtenteProfilatoMctc` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/utility/provincia`
> Ritorna la lista delle province rispondenti ai criteri forniti (data nulla equivale a data odierna)
- `operationId`: `findProvinceUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `sigla` | `query` | false | `string` | `` | sigla |
| `data` | `query` | false | `string` | `date` | data |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfListOfProvinciaIstat` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/utility/provincia/{codiceDtt}/comune`
> Ritorna la lista dei comuni in corso di validità
- `operationId`: `findComuniCorrentiUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceDtt` | `path` | true | `string` | `` | codiceDtt |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfListOfComuneIstat` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/utility/statiEsteri`
> Ritorna la lista degli stati esteri in corso di validità
- `operationId`: `findStatiEsteriUsingGET`



**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfListOfStatoEsteroIstat` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/utility/statoEstero`
> Ritorna la lista degli stati esteri rispondenti ai criteri forniti (data nulla equivale a data odierna)
- `operationId`: `findStatiEsteriUsingGET_1`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `nome` | `query` | false | `string` | `` | nome |
| `data` | `query` | false | `string` | `date` | data |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfListOfStatoEsteroIstat` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---
