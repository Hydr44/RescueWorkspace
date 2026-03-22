# Agenzia (CR)

CR Agenzia STA Controller

## GET `/demolitori-aci-ws/rest/cr/agenziaSTA/sedeOperativa/{codiceAgenzia}`
> Ritorna il dettaglio di un'agenzia STA per sede operativa
- `operationId`: `findAgenziaSedeOperativaUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceAgenzia` | `path` | true | `string` | `` | codiceAgenzia |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfAgenziaStaDTT` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/agenziaSTA/{codiceAgenzia}`
> Ritorna il dettaglio di un'agenzia STA
- `operationId`: `findOneUsingGET_4`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceAgenzia` | `path` | true | `string` | `` | codiceAgenzia |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfAgenziaStaDTT` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---
