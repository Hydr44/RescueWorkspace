// src/lib/rvfu-mock.js
// Mock RVFU service per funzionamento locale senza MIT
// Simula le risposte delle API RVFU per sviluppo e test

const MOCK_VEHICLES = [
  // Targhe reali ambiente formazione ACI
  // Il formato simula l'output normalizzato di verificaVeicolo (con proprietario nested)
  {
    targa: 'AG004557',
    telaio: '0037',
    marca: '', modello: '', marca_modello: '',
    tipoVeicolo: 'T',
    obbligoIscrizionePRA: 'N',
    radiabile: 'S',
    proprietario: {
      codiceFiscale: 'NTSPRM71L20H501B',
      cognome: 'NESTI', nome: 'PRIMO',
      dataNascita: '1971-07-20',
      comuneResidenza: 'ROMA', codiceComuneResidenza: '091',
      provinciaResidenza: 'ROMA', codiceProvinciaResidenza: '058', siglaProvinciaResidenza: 'RM',
      indirizzoResidenza: 'VIA FLAMINIA', numeroCivicoResidenza: '4', capResidenza: '00100',
    },
  },
  {
    targa: 'AG004559',
    telaio: '0035',
    marca: 'METALMEC', modello: 'ME 35C', marca_modello: 'METALMEC ME 35C',
    annoImmatricolazione: 1997,
    dataPrimaImmatricolazione: '1997-03-26',
    tipoVeicolo: 'T',
    obbligoIscrizionePRA: 'N',
    radiabile: 'S',
    proprietario: {
      codiceFiscale: 'MROBNI82B11H501L',
      cognome: 'BIANCHI', nome: 'MARIO',
      dataNascita: '1982-02-11',
      comuneResidenza: 'ROMA', codiceComuneResidenza: '091',
      provinciaResidenza: 'ROMA', codiceProvinciaResidenza: '058', siglaProvinciaResidenza: 'RM',
    },
  },
  {
    targa: 'VA189AJ',
    telaio: '',
    marca: '', modello: '', marca_modello: '',
    tipoVeicolo: 'A',
    obbligoIscrizionePRA: 'S',
    radiabile: 'S',
    categoria: 'M1',
    proprietario: {
      codiceFiscale: 'NTSPRM71L20H501B',
      cognome: 'NESTI', nome: 'PRIMO',
      dataNascita: '1971-07-20',
      comuneResidenza: 'ROMA', codiceComuneResidenza: '091',
      provinciaResidenza: 'ROMA', codiceProvinciaResidenza: '058', siglaProvinciaResidenza: 'RM',
      indirizzoResidenza: 'VIA FLAMINIA', numeroCivicoResidenza: '4', capResidenza: '00100',
    },
  },
];

let mockIdCounter = 1000;

/**
 * Simula la ricerca veicolo su RVFU
 */
export function mockVerificaVeicolo({ targa, telaio, codiceFiscale }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let found = null;

      if (targa) {
        found = MOCK_VEHICLES.find(v => v.targa.toUpperCase() === targa.toUpperCase());
      }
      if (!found && telaio) {
        found = MOCK_VEHICLES.find(v => v.telaio.toUpperCase() === telaio.toUpperCase());
      }

      if (found) {
        resolve({ ...found });
      } else {
        // Genera un veicolo fittizio basato sui parametri di ricerca
        resolve({
          targa: targa || 'XX000YY',
          telaio: telaio || 'ZFA00000000000000',
          marca: 'SCONOSCIUTO', modello: 'Veicolo di test', marca_modello: 'SCONOSCIUTO Veicolo di test',
          cilindrata: 1000, potenza: 50,
          annoImmatricolazione: 2020,
          dataPrimaImmatricolazione: '2020-01-01',
          tipoVeicolo: 'A',
          obbligoIscrizionePRA: 'S',
          radiabile: 'S',
          colore: 'GRIGIO', alimentazione: 'BENZINA', categoria: 'M1',
          proprietario: codiceFiscale ? {
            codiceFiscale,
            cognome: 'TEST', nome: 'UTENTE',
            comuneResidenza: 'ROMA', codiceComuneResidenza: '091',
            provinciaResidenza: 'ROMA', codiceProvinciaResidenza: '058', siglaProvinciaResidenza: 'RM',
            capResidenza: '00100',
          } : null,
          _isMock: true,
        });
      }
    }, 800); // Simula latenza rete
  });
}

/**
 * Simula la registrazione VFU su RVFU
 */
export function mockRegistraVFU(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockIdCounter++;
      resolve({
        esito: { codice: '000', descrizione: 'Operazione completata con successo' },
        result: {
          idVFU: mockIdCounter,
          statoVFU: 'INSERITO',
          dataInserimento: new Date().toISOString(),
          targa: payload?.veicolo?.targa || 'N/A',
        },
        _isMock: true,
      });
    }, 1200);
  });
}

/**
 * Simula lista VFU da RVFU
 */
export function mockListaVFU({ pageNumber = 0, pageSize = 20 } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockCases = MOCK_VEHICLES.map((v, i) => ({
        idVFU: 1000 + i + 1,
        targa: v.targa,
        telaio: v.telaio,
        marca: v.marca,
        modello: v.modello,
        statoVFU: i === 0 ? 'INSERITO' : i === 1 ? 'BONIFICATO' : 'DEMOLITO',
        dataInserimento: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        intestatario: {
          codiceFiscale: v.codiceFiscale,
          cognome: v.cognome,
          nome: v.nome,
        },
      }));

      resolve({
        content: mockCases.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize),
        totalElements: mockCases.length,
        totalPages: Math.ceil(mockCases.length / pageSize),
        number: pageNumber,
        size: pageSize,
        _isMock: true,
      });
    }, 600);
  });
}

/**
 * Simula export Excel
 */
export function mockExportExcel() {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Genera un blob vuoto come placeholder
      const blob = new Blob(['Mock Excel data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      resolve(blob);
    }, 500);
  });
}

/**
 * Simula stampa PDF
 */
export function mockStampaPDF() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const blob = new Blob(['Mock PDF data'], { type: 'application/pdf' });
      resolve(blob);
    }, 500);
  });
}

/**
 * Verifica se siamo in modalita mock (locale)
 */
export function isRVFUMockMode() {
  // Mock mode quando:
  // 1. Non siamo in Electron (browser dev)
  // 2. Flag esplicito
  // 3. Non c'e autenticazione RVFU attiva
  if (typeof window !== 'undefined' && window.__RVFU_MOCK_MODE === true) return true;
  if (typeof window !== 'undefined' && window.__RVFU_MOCK_MODE === false) return false;
  // Default: mock se non siamo in Electron
  return typeof window !== 'undefined' && !window.electronAPI;
}

/**
 * Attiva/disattiva modalita mock
 */
export function setRVFUMockMode(enabled) {
  if (typeof window !== 'undefined') {
    window.__RVFU_MOCK_MODE = enabled;
  }
}
