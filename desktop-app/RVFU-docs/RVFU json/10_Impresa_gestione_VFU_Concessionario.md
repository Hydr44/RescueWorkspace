# Impresa gestione VFU (Concessionario)

Concessionario Impresa Gestione VFU Controller

## GET `/demolitori-aci-ws/rest/concessionario/centriRaccoltaConferibili`
> Ritorna la lista dei CR che hanno delegato il concessionario
- `operationId`: `findCRConferibiliUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceFiscale` | `query` | false | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfListOfSedeImpresaVfu` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---
