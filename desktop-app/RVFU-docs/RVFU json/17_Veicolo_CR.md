# Veicolo (CR)

CR Veicolo Controller

## GET `/demolitori-aci-ws/rest/cr/causalePerCodice/{codiceCausale}`
> Ritorna la causale per codice
- `operationId`: `findByCodMtvInsVeiUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `codiceCausale` | `path` | true | `string` | `` | codiceCausale |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfCausaleVfuDto` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/causali`
> Ritorna la lista delle causali
- `operationId`: `findAllUsingGET`



**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfListOfCausaleVfuDto` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/veicolo`
> Ritorna il veicolo ricercato
- `operationId`: `findOneUsingGET_6`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `canaleNoPra` | `query` | false | `boolean` | `` |  |
| `causale` | `query` | true | `string` | `` |  |
| `cic` | `query` | false | `string` | `` |  |
| `cicOTelaio` | `query` | false | `boolean` | `` |  |
| `ciclomotore` | `query` | false | `boolean` | `` |  |
| `codiceFiscale` | `query` | false | `string` | `` |  |
| `targa` | `query` | false | `string` | `` |  |
| `targaOTelaio` | `query` | false | `boolean` | `` |  |
| `telaio` | `query` | false | `string` | `` |  |
| `tipoVeicolo` | `query` | true | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVeicolo` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---
