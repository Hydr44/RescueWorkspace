# PagoPA — Nuovo Sistema Pagamenti (v1.14)

Fonte: `manuali/SpecificheWS-NuovoSistemaPagamenti-1.14.pdf`

## URL Base

| Ambiente     | URL |
|-------------|-----|
| Formazione  | `https://formazione.ilportaledeltrasporto.it/` |
| Produzione  | `https://www.ilportaledeltrasporto.it/` |

**Path pagamenti**: `/pagamenti/sh/v1/...`
**Path anagrafica**: `/anagrafica/sh/v1/...`

**Autenticazione**: stessa OIDC del RVFU (Bearer id_token).

## Formato risposta standard

```json
{
  "esito": { "codice": "OK|KO", "descrizione": "..." },
  "risultato": { ... }
}
```

> **ATTENZIONE**: Gli endpoint del catalogo tariffario (4.1) NON usano il wrapper esito/risultato — restituiscono direttamente la lista.

---

## 4.1 Gestione Tariffario

### 4.1.1 Ricerca tipo tariffario
- **GET** `/pagamenti/sh/v1/catalogo/tariffario`
- **Input**: `codiceTipoTariffario`, `codiceProvincia`, `siglaProvincia` (tutti opzionali)
- **Output**: Lista tipi tariffario con province abbinate

### 4.1.2 Corrispondenza tariffe nuove/vecchie
- **GET** `/pagamenti/sh/v1/catalogo/corrispondenzatariffe`
- **Input**: `codiceTipoTariffario` (obbligatorio) + uno tra: `codicePraticaMctc`, vecchio/nuovo codice tariffa
- **Output**: Lista pratiche MCTC con nuovo codice tariffa

### 4.1.3 Catalogo pratiche tariffe completo
- **GET** `/pagamenti/sh/v1/catalogo/elencocompleto`
- **Output**: Elenco completo codici tariffario con pratiche MCTC e tariffe
- **Note**: Cacheable, invocare max 1x/giorno

---

## 4.2 Gestione Cassetto Pagamenti

### 4.2.1 Inserimento richieste pagamento (ASINCRONO)
- **POST** `/pagamenti/sh/v1/cassetto/inserimentoSpontaneo`
- **Input**: Array richieste con: `causalePagamento`, `codiceTipoTariffario`, `flagCumulativo`, `flagEsenzione`, `flagUrgenza`, `numeroPratiche`, `flagAggregato`, `flagAbbinamentoAutomatico`, `codiceTipoPraticaMctc`
- **Output**: `idCarrello` + anagrafica soggetto pagatore
- **Note**: Creazione asincrona — ricerca immediata potrebbe non trovare tutti i record

### 4.2.2 Inserimento richieste pagamento (SINCRONO)
- **POST** `/pagamenti/sh/v1/cassetto/inserimentospontaneosync`
- **Input**: Come 4.2.1 ma numero limitato di richieste per carrello
- **Output**: Come 4.2.1

### 4.2.3 Ricerca richieste
- **GET** `/pagamenti/sh/v1/cassetto/ricerca/richiestaPagamento`
- **Input**: `codiceIUV`, `codiceSottosistema`, `codiceStatoRichiesta`, `codiceTipoPratica`, `codiceTipoTariffario`, `dataCreazioneIUVA/Da`, `dataCreazioneRichiestaA/Da`, `dataPagamentoIUVA/Da`, `estremoPagamento`, `flagAbbinamento`, `flagApertura`, `flagCumulativo`, `flagUrgenza`, `idCarrello`, `numeroPratiche`, `codiceStatoIUV`, `idRichiesta`, `codiceTipoPraticaMctc`
- **Output**: Lista richieste con dettaglio e IUV associati

### 4.2.4 Cancella richiesta
- **PUT** `/pagamenti/sh/v1/cassetto/cancellarichiesta/{idRichiesta}`
- **Input**: `idRichiesta` (path param)
- **Output**: Esito

### 4.2.5 Stampa avviso di pagamento
- **GET** `/pagamenti/sh/v1/cassetto/stampaavvisopagamento/{idRichiestaPagamento}`
- **Output**: PDF avviso pagamento in formato base64

### 4.2.6 Stampa ricevuta di pagamento
- **GET** `/pagamenti/sh/v1/cassetto/stamparicevutatelematica/{idRichiestaPagamento}`
- **Output**: PDF ricevuta pagamento in formato base64

### 4.2.7 Modifica flag abbinamento automatico
- **POST** `/pagamenti/sh/v1/cassetto/abbinamento/abilita/automatico/{idRichiesta}/{flagAbbinamentoAutomatico}`
- **Input**: `idRichiesta` + `flagAbbinamentoAutomatico` (S/N) come path params
- **Output**: Esito + valore flag impostato

### 4.2.8 Verifica pagamenti (saldo)
- **GET** `/pagamenti/sh/v1/cassetto/saldo`
- **Input**: `codiceTipoPratica` + `codiceTipoTariffario` (obbligatori), `codiceTipoPraticaMctc`
- **Output**: Numero totale richieste PAGATA per tariffa

### 4.2.9 Inserimento pagamento conto terzi
- **POST** `/pagamenti/sh/v1/cassetto/inserimentospontaneosync/contoterzi`
- **Input**: Dati pratica + `titolareCassetto` (obbligatorio: nome, cognome, codiceFiscale, tipoPagatore, dataNascita, flagSesso, dati nascita) + `titolarePratica` (opzionale)
- **Output**: PDF avviso pagamento in formato base64

### 4.2.10 Saldo completo
- **GET** `/pagamenti/sh/v1/cassetto/saldoCompleto`
- **Output**: Saldo completo cassetto

### 4.2.11 Ricerca richieste pagate
- **GET** `/pagamenti/sh/v1/cassetto/richiestePagate`
- **Input**: `codiceTariffa`, `codiceTipoTariffario`, `flagAbbinamentoAutomatico` (S=solo auto, N=solo manuali)
- **Output**: Elenco estremi in stato PAGATA

---

## 4.3 Gestione Anagrafica

### 4.3.1 Elenco province valide
- **GET** `/anagrafica/sh/v1/elencoProvincieValide`
- **Output**: Lista province con `codiceProvincia`, `denominazioneProvincia`, `siglaProvincia`

### 4.3.2 Elenco province valide a data
- **GET** `/anagrafica/sh/v1/elencoProvincieValideByDate/{dataValidita}`

### 4.3.3 Elenco comuni validi
- **GET** `/anagrafica/sh/v1/elencoComuniValidi/{codiceProvincia}`
- **Output**: Lista comuni con `codiceAnagrafeTributariaComune`, `codiceComune`, `codiceProvincia`, `codiceIstatComune`, `codiceIstatProvincia`, `denominazioneComune`

### 4.3.4 Elenco comuni validi a data
- **GET** `/anagrafica/sh/v1/elencoComuniValidiByData/{codiceProvincia}/{dataValidita}`

### 4.3.5 Elenco stati validi
- **GET** `/anagrafica/sh/v1/elencoStatiValidi`
- **Output**: Lista stati con `codiceAnagrafeTributariaStato`, `codiceIsoStato`, `codiceIstatStato`, `codiceStato`, `denominazioneStato`

### 4.3.6 Elenco stati validi a data
- **GET** `/anagrafica/sh/v1/elencoStatiValidiByData/{dataValidita}`

---

## 4.4 Riscatto Voucher

### 4.4.1 Inserimento adesione
- **POST** `/pagamenti/sh/v1/cassetto/adesioneriscatto`
- **Input**: `codiceTariffa`, `codiceTipoTariffario`

### 4.4.2 Revoca adesione
- **PUT** `/pagamenti/sh/v1/cassetto/adesioneriscatto/{progressivo}/revoca`

### 4.4.3 Ricerca adesioni
- **GET** `/pagamenti/sh/v1/cassetto/adesioneriscatto`
- **Input**: `codiceTariffa`, `codiceTipoTariffario`, `progressivo` (tutti opzionali)

### 4.4.4 Verifica codice riscatto
- **GET** `/pagamenti/sh/v1/cassetto/codiceriscatto/verifica`
- **Input**: `codiceFiscale` + `codiceRiscatto` (obbligatori)

### 4.4.5 Finalizza riscatto
- **PUT** `/pagamenti/sh/v1/cassetto/codiceriscatto/finalizza`
- **Input**: `codiceFiscale` + `codiceRiscatto`

---

## 4.5 Disaggregazione IUV

### 4.5.1 Disaggrega IUV
- **PUT** `/pagamenti/sh/v1/cassetto/disaggrega/{idRichiesta}`
- **Output**: Lista codici IUV disaggregati

### 4.5.2 Ricerca IUV disaggregati
- **GET** `/pagamenti/sh/v1/cassetto/ricerca/disaggregati`
- **Output**: Lista completa IUV disaggregati nel cassetto

---

## Tipologiche

### Stati richiesta
| Codice | Descrizione |
|--------|-------------|
| D | DA PAGARE |
| C | CREAZIONE IN CORSO |
| P | PAGATA |
| B | BRUCIATA |
| L | CANCELLATA |
| Z | PARZIALMENTE CANCELLATA |
| A | PARZIALMENTE ANNULLATA |
| N | DA INTEGRARE |
| E | DA INTEGRARE IN ERRORE |
| X | ELABORATA CON ERRORE |
| I | PAGAMENTO IN CORSO |

### Stati IUV
| Codice | Valori |
|--------|--------|
| C, E, D, A, P, B, R, S, M, T, N | — |

### Codici sottosistema
| Codice | Descrizione |
|--------|-------------|
| 04 | REVISIONI E COLLAUDI |
| 07 | PATENTI |
| 08 | DOCUMENTO UNICO |

### Flag apertura
| Codice | Descrizione |
|--------|-------------|
| B | SERALE |
| R | REAL TIME |
| S | SPONTANEA |
