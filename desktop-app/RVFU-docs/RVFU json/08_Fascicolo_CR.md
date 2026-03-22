# Fascicolo (CR)

CR Fascicolo Controller

## POST `/demolitori-aci-ws/rest/cr/allega/documentoVFU/{idVFU}`
> Permette di allegare un documento VFU
- `operationId`: `allegaDocumentoUsingPOST`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |

**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `DocumentoVFUCreate` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDocumentoVFU` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## DELETE `/demolitori-aci-ws/rest/cr/cartellaFirma/{idCartella}`
> Annulla cartella firma e crea nuova cartella con gli stessi documenti
- `operationId`: `annullaAndClonaCartellaFirmaVFUUsingDELETE`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idCartella` | `path` | true | `integer` | `int64` | idCartella |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfFascicoloVFU` | OK |
| `204` | `-` | No Content |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |

---

## PUT `/demolitori-aci-ws/rest/cr/chiudi/fascicolo/{idVFU}`
> Permette la chiusura di un fascicolo
- `operationId`: `chiudiFascicoloUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfFascicoloVFU` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/consulta/documentoVFU/{idVFU}`
> Ritorna la lista delle informazioni dei documenti del veicolo fuori uso
- `operationId`: `consultaDocumentiUsingGET_2`

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

## GET `/demolitori-aci-ws/rest/cr/documentoVFU`
> Permette di scaricare un documento di un veicolo fuori uso
- `operationId`: `downloadDocumentoVfuUsingGET_2`

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

## POST `/demolitori-aci-ws/rest/cr/documentoVFU`
> Permette di eliminare un documento di un veicolo fuori uso
- `operationId`: `eliminaDocumentoVFUUsingPOST`


**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `CriteriRicercaDocumento` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDocumentoVFU` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/documentoVFU`
> Permette di sostituire un documento di un veicolo fuori uso
- `operationId`: `aggiornaDocumentoVFUUsingPUT`


**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `DocumentoVFUReq` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDocumentoVFU` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/fascicolo/{idFascicolo}`
> Ritorna il dettaglio di un fascicolo
- `operationId`: `dettaglioFascicoloUsingGET_1`

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

## POST `/demolitori-aci-ws/rest/cr/genera/certificatoRottamazione/{idVFU}`
> Permette di generare il certificato di rottamazione del veicolo fuori uso
- `operationId`: `generaCertificatoRottamazioneUsingPOST`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDocumentoVFU` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## POST `/demolitori-aci-ws/rest/cr/genera/postillaCdr/{idVFU}`
> Aggiunge postilla al CdR
- `operationId`: `generaPostillaCdrUsingPOST`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |

**Request Body**

| Content-Type | Schema |
|---|---|
| `application/json` | `PostillaCdrCreate` |

**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDocumentoVFU` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## POST `/demolitori-aci-ws/rest/cr/genera/ricevutaPresaInCarico/{idVFU}`
> Permette di generare la ricevuta di presa in carico del veicolo fuori uso
- `operationId`: `generaRicevutaPresaInCaricoUsingPOST`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDocumentoVFU` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/inviaAlTablet/{idFascicolo}`
> Permette di inviare al tablet i documenti allegati
- `operationId`: `inviaAlTabletUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idFascicolo` | `path` | true | `integer` | `int64` | idFascicolo |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfDocumentoVFU` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## PUT `/demolitori-aci-ws/rest/cr/riapri/fascicolo/{idVFU}`
> Permette la riapertura di un fascicolo
- `operationId`: `riapriFascicoloUsingPUT`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idVFU` | `path` | true | `integer` | `int64` | idVFU |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfFascicoloVFU` | OK |
| `201` | `-` | Created |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---

## GET `/demolitori-aci-ws/rest/cr/verifica/fascicolo/{idFascicolo}`
> Permette la verifica di un fascicolo
- `operationId`: `verificaFascicoloUsingGET`

**Parameters**

| Name | In | Required | Type | Format | Description |
|---|---|---:|---|---|---|
| `idFascicolo` | `path` | true | `integer` | `int64` | idFascicolo |


**Responses**

| Status | Schema | Description |
|---:|---|---|
| `200` | `VfuRestResponseOfboolean` | OK |
| `401` | `-` | Unauthorized |
| `403` | `-` | Forbidden |
| `404` | `-` | Not Found |

---
