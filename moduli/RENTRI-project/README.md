# Documentazione RENTRI – Ambiente Demo

Questa cartella raccoglie una copia offline della documentazione pubblicata sul portale ufficiale RENTRI per l'ambiente demo (<https://demoapi.rentri.gov.it/docs?page=home>). I contenuti sono stati scaricati il $(date +%Y-%m-%d) e corrispondono alla versione `1.1.1072` indicata nei metadati del sito.

## Struttura

- `demo-docs/menu.json`: struttura di navigazione ufficiale (voci e slug).
- `demo-docs/endpoints.json`: elenco dei servizi API disponibili con relative versioni.
- `demo-docs/md/*.md`: pagine Markdown del portale (introduzione, accesso, flussi, risorse, supporto, ecc.).
- `demo-docs/api/*.json`: specifiche OpenAPI v1.0 per `anagrafiche`, `ca-rentri`, `codifiche`, `dati-registri`, `formulari`, `vidimazione-formulari`.
- `plans/`: documentazione interna (architettura, roadmap, checklist, proxy mTLS, client REST, …).

## Aggiornare la copia locale

```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace
VERSION=$(curl -s 'https://demoapi.rentri.gov.it/docs?page=home' \
  | grep -o 'meta name="version" content="[^"]*' \
  | sed 's/.*content="//')
DEST=RENTRI-project/demo-docs
mkdir -p "$DEST/md" "$DEST/api"
# Scarica le pagine
PAGES=(home accesso-intro accesso-preliminari accesso-auth accesso-certificati \
       api-flussi-operativi-introduzione api-flussi-operativi-registri \
       api-flussi-operativi-formulari api-flussi-operativi-formulari-digitali \
       api-flussi-operativi-mobile schemi-xsd-demo registro-digitale \
       guida-tecnica-struttura-fir-digitale controlli-validazione-xfir \
       changelog-demo esempi supporto-ingaggio supporto-eventi supporto-faq)
for slug in "${PAGES[@]}"; do
  curl -s "https://demoapi.rentri.gov.it/docs/${slug}.md?v=${VERSION}" \
    -o "$DEST/md/${slug}.md"
done
# Scarica menu/endpoint e OpenAPI
curl -s "https://demoapi.rentri.gov.it/docs/menu.json?v=${VERSION}" \
  -o "$DEST/menu.json"
curl -s "https://demoapi.rentri.gov.it/docs/endpoints?v=${VERSION}" \
  -o "$DEST/endpoints.json"
APIS=(anagrafiche ca-rentri codifiche dati-registri formulari vidimazione-formulari)
for api in "${APIS[@]}"; do
  curl -s "https://demoapi.rentri.gov.it/docs/${api}/v1.0" \
    -o "$DEST/api/${api}-v1.0.json"
done
```

## Note operative

- Le pagine sono in Markdown già pronte per essere referenziate in rapporti tecnici o manuali interni.
- Le specifiche OpenAPI possono essere caricate in strumenti come Stoplight, Postman o Insomnia per generare SDK o collection di test.
- I collegamenti interni mantenuti nel Markdown (`javascript:loadPage('...')`) indicano l'ancora originale del portale e consentono di risalire rapidamente alla fonte online.
- Per eventuali nuove sezioni rilasciate da RENTRI è sufficiente aggiungere lo slug corrispondente all'array `PAGES` prima di eseguire lo script di aggiornamento.
- Per l’autenticazione alle API RENTRI sono richieste le seguenti variabili d’ambiente (sia su VPS che su Vercel):
  ```
  RENTRI_GATEWAY_URL=https://rentri-test.rescuemanager.eu
  RENTRI_HTTP_TIMEOUT_MS=30000
  RENTRI_JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
  RENTRI_JWT_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
  RENTRI_JWT_ISSUER=SCZMNL05L21D960T        # CF/ISS del certificato
  RENTRI_JWT_AUDIENCE=rentrigov.demo.api    # in produzione: rentrigov.api
  RENTRI_JWT_ALG=ES256                      # default per certificati EC
  RENTRI_JWT_PRIVATE_KEY_FILE=/percorso/chiave.pem   # opzionale, alternativa a RENTRI_JWT_PRIVATE_KEY
  RENTRI_JWT_CERT_FILE=/percorso/certificato.pem     # opzionale
  ```
