## Autenticazione

Nei prossimi capitoli si farà riferimento espressamente al documento [linee_guida_interoperabilit_tecnica_pa.pdf 
(agid.gov.it)](https://www.agid.gov.it/sites/default/files/repository_files/linee_guida_interoperabilit_tecnica_pa.pdf) (*e ai suoi allegati*) delle guida AgID relativamente all'interoperabilità, ed in particolare ai pattern sicurezza: **ID_AUTH_REST_0*** e **INTEGRITY_REST_01**. 

Inoltre, si farà riferimento al token JWT (JSON Web Token) ossia allo standard per la creazione di modelli di dati, con firma, dove il corpo (payload) contiene un JSON con una o più attestazioni (`claims`).

Si farà riferimento anche alle relative attestazioni più comuni: **`iat`**, **`exp`**, **`nbf`**, **`aud`**, **`iss`**, ...

Per l'autenticazione ai servizi viene utilizzato il pattern sicurezza delle linee guida AgID **ID_AUTH_REST_02**.

### Regole di processamento

Il pattern prevede la generazione di un token JWT, costruito nelle modalità di seguito riportate, e firmato con il certificato riconosciuto in RENTRI come descritto in precedenza.

Il token JWT firmato, utilizzando lo standard JWS (JSON Web Signature), dovrà essere poi trasmesso nell'header della richiesta HTTP *Authorization Bearer*.

#### Costruzione dell'header

Dovranno essere indicati i parametri:
- **`alg`** (*Algorithm*) con l'algoritmo di firma (es RS256, ES256, ...);
- **`typ`** (*Type*) impostato a JWT;
- **`x5c`** (*spec.AgId X.509 Certificate Chain*) con un array il cui unico elemento deve essere una stringa corrispondente alla rappresentazione in Base64 del certificato X.509 utilizzato per firmare il token JWT e riconosciuto in RENTRI.

#### Costruzione del payload

Nel payload dovranno essere indicate le seguenti attestazioni (`claims`):
- **`exp`** (*Expiration Time*), **`iat`** (*Issued At*) e **`nbf`** (*Not Before*) per indicare rispettivamente la scadenza del token, il momento del rilascio del token, il momento da cui il token può ritenersi valido. I valori sono rappresentati secondo il formato *‘epoch time’*.
- **`aud`** (*Audience*) impostato alla costante *`rentrigov.demo.api`* (per Produzione: *`rentrigov.api`*);
- **`iss`** (*Issuer*) impostato con l'identificativo a cui è intestato il certificato utilizzato per la firma del token JWT ed indicato nel header paramenter **`x5c`**;
- **`jti`** (*JWT ID*) identificativo del token JWT, questo valore deve essere univoco per il fruitore e non ha una formattazione particolare.

#### Esempio ID_AUTH_REST_02

```json
# HTTP request
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...

# deserializzazione del token JWT
# header
{
	"alg": "RS256",
	"typ": "JWT",
	"x5c": ["MIIH9jCCA96..."]
}
# payload
{
	"jti": "44ad6ba0-eaf3-4ad1-9557-968347781112",
	"aud": "rentrigov.demo.api",
	"iss": "04527551008",
	"exp": 1619774997,
	"iat": 1619774877,
	"nbf": 1619774877
}
```

## Integrità

Per gli endpoint con verbo HTTP **<span style="color:#61affe">POST</span>** o **<span style="color:#fca130">PUT</span>** che prevedono un body JSON, all'header HTTP *Authorization Bearer*, va aggiunto l'header HTTP *Agid-JWT-Signature* che permette la verifica dell'integrità del dato stesso.

Viene utilizzato il pattern di sicurezza **INTEGRITY_REST_01** proposto dalle linee guida AgID per l'interoperabilità.

### Regole di processamento

Il pattern **INTEGRITY_REST_01** è un'estensione del **ID_AUTH_REST_02** e prevede anch'esso la generazione di un token JWT firmato con certificato riconosciuto in RENTRI.

Il token JWT dovrà essere poi trasmesso nell'header della richiesta HTTP *Agid-JWT-Signature*, in aggiunta a *Authorization Bearer*.

L'header del token JWT prevede gli stessi parametri del **ID_AUTH_REST_02** (vedi capitolo precedente), mentre il payload dovrà contenere il claim aggiuntivo *signed_headers* descritto nel prossimo paragrafo.

#### *Claim signed_headers*

Questo claim contiene valori multipli, quindi non contiene una stringa, ma un array di coppie *chiave-valore*:
- *`digest`* contiene il valore dell'HTTP header *digest*, corrispondente al Base 64 dell'hash SHA-256 calcolato sul body della request, a cui deve essere apposta l'indicazione dell'algoritmo utilizzato: *SHA-256=*;
- *`content-type`* (quando presente nell'HTTP Header) contiene il valore dell'HTTP header *content-type*;
- *`content-encoding`* (quando presente nell'HTTP Header) contiene il valore dell’HTTP header *content-encoding*.

#### Esempio INTEGRITY_REST_01
```json
# HTTP request
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsI...
Agid-JWT-Signature: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCI...
Digest: SHA-256=pMTw2VNDHuvxNP6SKK30tq/09dgT6TOWFs6zAap795I=
Content-Type: application/json; charset=utf-8

# deserializzazione del token JWT 
# header
{
	"alg": "RS256",
	"typ": "JWT",
	"x5c": ["MIIH9jCCA96..."]
}
# payload
{
	"jti": "fbbc862e-be92-4c7d-90e9-b1e2da0e262e",
	"signed_headers": [
		{
			"digest": "SHA-256=pMTw2VNDHuvxNP6SKK30tq/09dgT6TOWFs6zAap795I="
		},
		{
			"content-type": "application/json; charset=utf-8"
		}
	],
	"aud": "rentrigov.demo.api",
	"iss": "04527551008",
	"exp": 1619794064,
	"iat": 1619793944,
	"nbf": 1619793944
}
```

---

*Ultimo aggiornamento: 10/06/2024*