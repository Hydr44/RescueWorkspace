# internal-radiazione

Internal Radiazione Controller

## POST `/demolitori-aci-ws/internal/rest/VFU/allega/ricevutaRadiazioneVFU`
> Conferma la radiazione di un VFU PRA allegando la relativa ricevuta e cambiando lo stato in 'Radiato'
- `operationId`: `allegaRicevutaRadiazioneVFUUsingPOST`


**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `VFUConfermaRadiazionePra` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDocumentoVFU` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/internal/rest/VFU/dettaglio`
> Ritorna dettaglio del veicolo fuori uso richiamato da DU
- `operationId`: `dettaglioUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `obbligoIscrizionePRA` | `query` | true | `string` | `` |  |
| `targa` | `query` | true | `string` | `` |  |
| `tipo` | `query` | true | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfVFUBean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/internal/rest/VFU/dettaglioFascicolo`
> Ritorna il dettaglio di un fascicolo richiamato da DU
- `operationId`: `dettaglioFascicoloUsingGET_2`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `obbligoIscrizionePRA` | `query` | true | `string` | `` |  |
| `targa` | `query` | true | `string` | `` |  |
| `tipo` | `query` | true | `string` | `` |  |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfFascicoloVFU` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---
