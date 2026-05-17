'use strict';

/**
 * Helper comuni per la trasmissione fatture via WS.
 * - injectTerzoIntermediario: aggiunge TerzoIntermediarioOSoggettoEmittente + SoggettoEmittente
 *   (firmatario Emmanuel via OpenAPI/Namirial != CedentePrestatore RescueManager -> richiesto da SdI)
 * - nomeFileFattura: costruisce IT<idTrasmittente>_<progressivo>.xml.p7m
 */

// TerzoIntermediarioOSoggettoEmittente.
// Il soggetto dichiarato a SdI come terzo intermediario PUO' essere la società
// (RescueManager SRL): il certificato di firma resta intestato al legale
// rappresentante (firma automatica Namirial) — SdI non richiede che firmatario
// e terzo intermediario coincidano.
//
// Forma controllata da SDI_TERZO_FORMA:
//   - 'societa'  (default) → IdFiscaleIVA + Denominazione
//   - 'persona'            → CodiceFiscale + Nome/Cognome (vecchio comportamento)
const TERZO_FORMA = (process.env.SDI_TERZO_FORMA || 'societa').toLowerCase();

const INTERMEDIARIO = TERZO_FORMA === 'persona'
  ? {
      tipo: 'persona',
      codice_fiscale: process.env.SDI_TERZO_CF || 'SCZMNL05L21D960T',
      nome: process.env.SDI_TERZO_NOME || 'EMMANUEL SALVATORE',
      cognome: process.env.SDI_TERZO_COGNOME || 'SCOZZARINI',
    }
  : {
      tipo: 'societa',
      p_iva: process.env.SDI_TERZO_PIVA || process.env.SDI_ID_TRASMITTENTE || '02176370852',
      denominazione: process.env.SDI_TERZO_DENOMINAZIONE || 'RESCUEMANAGER SRL',
    };

// IdTrasmittente usato nel NomeFile (paese+idcodice). RescueManager P.IVA.
const ID_PAESE = 'IT';
const ID_TRASMITTENTE = process.env.SDI_ID_TRASMITTENTE || '02176370852';

function injectTerzoIntermediario(xml, intermediario = INTERMEDIARIO) {
  // Schema FatturaPA 1.2: SoggettoEmittente e TerzoIntermediario sono gli ULTIMI
  // figli di FatturaElettronicaHeader (dopo CessionarioCommittente), NON in DatiTrasmissione.
  if (xml.includes('<TerzoIntermediarioOSoggettoEmittente>')) return xml; // gia presente

  // DatiAnagrafici (schema FatturaPA 1.2): (IdFiscaleIVA? , CodiceFiscale? , Anagrafica).
  // Società → IdFiscaleIVA + Anagrafica/Denominazione.
  // Persona → CodiceFiscale + Anagrafica/Nome+Cognome.
  let datiAnagrafici;
  if (intermediario.tipo === 'societa') {
    datiAnagrafici = `<IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>${intermediario.p_iva}</IdCodice>
        </IdFiscaleIVA>
        <Anagrafica>
          <Denominazione>${intermediario.denominazione}</Denominazione>
        </Anagrafica>`;
  } else {
    datiAnagrafici = `<CodiceFiscale>${intermediario.codice_fiscale}</CodiceFiscale>
        <Anagrafica>
          <Nome>${intermediario.nome}</Nome>
          <Cognome>${intermediario.cognome}</Cognome>
        </Anagrafica>`;
  }

  const block = `
    <TerzoIntermediarioOSoggettoEmittente>
      <DatiAnagrafici>
        ${datiAnagrafici}
      </DatiAnagrafici>
    </TerzoIntermediarioOSoggettoEmittente>
    <SoggettoEmittente>TZ</SoggettoEmittente>`;
  return xml.replace(/(<\/FatturaElettronicaHeader>)/, `${block}\n  $1`);
}

// Progressivo: alfanumerico max 5 char [A-Za-z0-9]. Da invoice.number, fallback random.
function sanitizeProgressivo(num) {
  let p = String(num || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 5);
  if (p.length === 0) p = Math.random().toString(36).slice(2, 7).toUpperCase();
  return p;
}

function nomeFileFattura(invoiceNumber, { signed = true } = {}) {
  const prog = sanitizeProgressivo(invoiceNumber);
  const base = `${ID_PAESE}${ID_TRASMITTENTE}_${prog}.xml`;
  return signed ? `${base}.p7m` : base;
}

module.exports = { injectTerzoIntermediario, sanitizeProgressivo, nomeFileFattura, INTERMEDIARIO, ID_TRASMITTENTE };
