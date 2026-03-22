# Delega (CR)

CR Delega Controller

## GET `/demolitori-aci-ws/rest/cr/consulta/delega`
> Ritorna la lista paginata delle deleghe emesse
- `operationId`: `consultaDelegheUsingGET_1`

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

## POST `/demolitori-aci-ws/rest/cr/delega`
> Permette l'inserimento di una nuova delega
- `operationId`: `inserisciDelegaUsingPOST`


**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `DelegaCreate` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDelega` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## DELETE `/demolitori-aci-ws/rest/cr/delega/{idDelega}`
> Permette l'annullamento di una delega
- `operationId`: `eliminaDelegaUsingDELETE`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idDelega` | `path` | true | `integer` | `int64` | idDelega |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDelega` | OK |
| `204` | `-` | No Content |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |

---

## GET `/demolitori-aci-ws/rest/cr/delega/{idDelega}`
> Ritorna il dettaglio di una delega
- `operationId`: `findOneUsingGET_5`

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

## PUT `/demolitori-aci-ws/rest/cr/delega/{idDelega}`
> Permette l'aggiornamento di una delega
- `operationId`: `aggiornaDelegaUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idDelega` | `path` | true | `integer` | `int64` | idDelega |

**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `DelegaUpdate` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDelega` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/revoca/delega/{idDelega}`
> Permette la revoca di una delega
- `operationId`: `revocaDelegaUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idDelega` | `path` | true | `integer` | `int64` | idDelega |

**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `DelegaRevoca` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDelega` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/stampa/delega`
> Ritorna il pdf della lista paginata delle deleghe emesse
- `operationId`: `stampaDelegheUsingGET_1`

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
