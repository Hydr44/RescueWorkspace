# Veicolo (Concessionario)

Concessionario Veicolo Controller

## GET `/demolitori-aci-ws/rest/concessionario/veicolo`
> Ritorna il veicolo ricercato
- `operationId`: `findOneUsingGET_2`

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
