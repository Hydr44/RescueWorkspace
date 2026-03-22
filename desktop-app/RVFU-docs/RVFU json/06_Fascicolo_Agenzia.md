# Fascicolo (Agenzia)

Agenzia Fascicolo Controller

## GET `/demolitori-aci-ws/rest/agenzia/consulta/documentoVFU/{idVFU}`
> Ritorna la lista dei documenti di un veicolo fuori uso visibile all'agenzia
- `operationId`: `consultaDocumentiUsingGET`

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

## GET `/demolitori-aci-ws/rest/agenzia/documentoVFU`
> Permette di scaricare un documento di un veicolo fuori uso
- `operationId`: `downloadDocumentoVfuUsingGET`

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

## GET `/demolitori-aci-ws/rest/agenzia/fascicolo/{idFascicolo}`
> Ritorna il dettaglio di un fascicolo visibile all'agenzia
- `operationId`: `dettaglioFascicoloUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idFascicolo` | `path` | true | `integer` | `int64` | idFascicolo |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfFascicoloVFU` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---
