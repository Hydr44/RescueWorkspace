# Fascicolo (Concessionario)

Concessionario Fascicolo Controller

## GET `/demolitori-aci-ws/rest/concessionario/consulta/documentoVFU/{idVFU}`
> Ritorna la lista delle informazioni dei documenti del veicolo fuori uso
- `operationId`: `consultaDocumentiUsingGET_1`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfListOfDocumentoVFU` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/concessionario/documentoVFU`
> Permette di scaricare un documento di un veicolo fuori uso
- `operationId`: `downloadDocumentoVfuUsingGET_1`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idAci` | `query` | false | `integer` | `int64` |  |
| `idFascicolo` | `query` | false | `integer` | `int64` |  |
| `progressivoDocumento` | `query` | false | `integer` | `int64` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDocumentoVFU` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---
