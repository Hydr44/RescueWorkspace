/**
 * SDI-SFTP Server
 * Server Node.js sulla VPS per gestione SFTP SDI
 * Porta: 3004
 */

require('dotenv').config({ path: '/root/.env' });

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const SftpClient = require('ssh2-sftp-client');
const AdmZip = require('adm-zip');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { generateFatturaPA } = require('./xml-generator');

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.SDI_SFTP_PORT || 3004;

// Configurazione
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[SDI-SFTP-SERVER] Errore: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY richiesti');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Configurazione SFTP
const SFTP_CONFIG = {
  host: process.env.SDI_SFTP_HOST || '127.0.0.1',
  port: parseInt(process.env.SDI_SFTP_PORT_SFTP || process.env.SDI_SFTP_PORT || '22', 10),
  username: process.env.SDI_SFTP_USERNAME || 'sdi',
  privateKey: process.env.SDI_SFTP_PRIVATE_KEY ? fs.readFileSync(process.env.SDI_SFTP_PRIVATE_KEY) : undefined,
  testMode: process.env.SDI_SFTP_TEST_MODE === 'true',
};

// Path certificati
const CERT_PATHS = {
  firma: process.env.SDI_CERT_FIRMA_PATH || '/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.firma.p12',
  cifra: process.env.SDI_CERT_CIFRA_PATH || '/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12',
  sogeiPublic: process.env.SDI_CERT_SOGEI_PUBLIC_PATH || '/opt/sdi-certs/sogeiunicocifra.pem',
  password: process.env.SDI_CERT_PASSWORD || 'IBVvOZqq',
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sdi-sftp-server', port: PORT });
});

/**
 * GET /monitor
 * Serve pagina HTML di monitoraggio
 */
app.get('/monitor', (req, res) => {
  const htmlPath = path.join(__dirname, 'monitor.html');
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.status(404).send('Pagina monitor non trovata');
  }
});

/**
 * GET /api/sdi-sftp/status
 * Restituisce lo stato dei file SDI (file in attesa, file EO, ecc.)
 */
app.get('/api/sdi-sftp/status', async (req, res) => {
  try {
    const testMode = SFTP_CONFIG.testMode;
    const uploadDir = testMode ? '/var/sftp/sdi/DatiVersoSdITest' : '/var/sftp/sdi/DatiVersoSdI';
    const downloadDir = testMode ? '/var/sftp/sdi/DatiDaSdITest' : '/var/sftp/sdi/DatiDaSdI';

    // Leggi file in attesa di prelevamento
    let filesPending = [];
    try {
      const files = fs.readdirSync(uploadDir);
      filesPending = files
        .filter(f => f.startsWith('FI.') && f.endsWith('.zip'))
        .map(f => {
          const stats = fs.statSync(`${uploadDir}/${f}`);
          return {
            filename: f,
            size: stats.size,
            uploaded_at: stats.mtime.toISOString(),
            status: 'pending'
          };
        })
        .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
    } catch (err) {
      console.error('[STATUS] Errore lettura upload dir:', err.message);
    }

    // Leggi file EO (esiti)
    let filesEO = [];
    try {
      const files = fs.readdirSync(downloadDir);
      filesEO = files
        .filter(f => f.startsWith('EO.') && (f.endsWith('.xml') || f.endsWith('.xml.run')))
        .map(f => {
          const stats = fs.statSync(`${downloadDir}/${f}`);
          let content = null;
          try {
            content = fs.readFileSync(`${downloadDir}/${f}`, 'utf8');
          } catch (err) {
            // Ignora errori di lettura
          }
          return {
            filename: f,
            size: stats.size,
            generated_at: stats.mtime.toISOString(),
            content: content
          };
        })
        .sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));
    } catch (err) {
      console.error('[STATUS] Errore lettura download dir:', err.message);
    }

    // Leggi file ER (notifiche di scarto)
    // ER viene prodotto in caso di errore nella fase di decifratura (codice 1) 
    // o verifica firma del supporto (codice 2)
    let filesER = [];
    try {
      const files = fs.readdirSync(downloadDir);
      filesER = files
        .filter(f => f.startsWith('ER.') && f.endsWith('.run'))
        .map(f => {
          const stats = fs.statSync(`${downloadDir}/${f}`);
          let content = null;
          let errorCode = null;
          let relatedFile = null;
          try {
            content = fs.readFileSync(`${downloadDir}/${f}`, 'utf8');
            // Il contenuto è: FI.xxxxx.zip;codice_errore
            // codice_errore: 1 = errore decifratura, 2 = errore verifica firma
            const match = content.match(/^(.+);(\d+)$/);
            if (match) {
              relatedFile = match[1];
              errorCode = parseInt(match[2]);
            }
          } catch (err) {
            // Ignora errori di lettura
          }
          return {
            filename: f,
            size: stats.size,
            generated_at: stats.mtime.toISOString(),
            content: content,
            error_code: errorCode,
            related_file: relatedFile,
            error_description: errorCode === 1 ? 'Errore decifratura' : errorCode === 2 ? 'Errore verifica firma' : 'Errore sconosciuto'
          };
        })
        .sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));
    } catch (err) {
      console.error('[STATUS] Errore lettura file ER:', err.message);
    }

    // Leggi file FO (fatture passive ricevute)
    // FO sono file ZIP firmati e cifrati (.zip.p7m.enc)
    let filesFO = [];
    try {
      const files = fs.readdirSync(downloadDir);
      filesFO = files
        .filter(f => f.startsWith('FO.') && f.endsWith('.zip.p7m.enc'))
        .map(f => {
          const stats = fs.statSync(`${downloadDir}/${f}`);
          return {
            filename: f,
            size: stats.size,
            received_at: stats.mtime.toISOString(),
            status: 'unprocessed' // TODO: Verificare se già processato nel DB
          };
        })
        .sort((a, b) => new Date(b.received_at) - new Date(a.received_at));
    } catch (err) {
      console.error('[STATUS] Errore lettura file FO:', err.message);
    }

    res.json({
      test_mode: testMode,
      timestamp: new Date().toISOString(),
      files_pending: filesPending,
      files_eo: filesEO,
      files_er: filesER,
      files_fo: filesFO, // ✅ NUOVO: File FO aggiunti
      summary: {
        pending_count: filesPending.length,
        eo_count: filesEO.length,
        er_count: filesER.length,
        fo_count: filesFO.length // ✅ NUOVO: Conteggio FO
      }
    });

  } catch (error) {
    console.error('[STATUS] Errore:', error);
    res.status(500).json({ 
      error: 'Errore lettura status', 
      details: error.message 
    });
  }
});

/**
 * Utility: Calcola giorno giuliano
 */
function getJulianDate(date = new Date()) {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const diffTime = date.getTime() - startOfYear.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const julianDay = String(diffDays).padStart(3, '0');
  return `${year}${julianDay}`;
}

/**
 * Utility: Genera nome file FI
 */
function generateFIFilename(idNodo, progressivo, testMode = false) {
  const now = new Date();
  const aaaaggg = getJulianDate(now);
  const hhmm = String(now.getHours()).padStart(2, '0') + 
               String(now.getMinutes()).padStart(2, '0');
  
  const nnn = testMode 
    ? String(Math.min(999, Math.max(900, progressivo))).padStart(3, '0')
    : String(Math.min(899, Math.max(0, progressivo))).padStart(3, '0');
  
  return `FI.${idNodo}.${aaaaggg}.${hhmm}.${nnn}.zip`;
}

/**
 * Utility: Genera file FileQuadraturaFTP XML
 * Questo file DESCRIVE il supporto e deve essere incluso nello ZIP
 */
function generateFileQuadraturaFTP(idNodo, nomeSupporto, numFatture) {
  const now = new Date();
  const dataOraCreazione = now.toISOString();
  
  // Formato conforme a FtpTypes_v2.0.xsd
  // Usa prefisso namespace come nel file di esempio (FY.xxxxxxxxxxx.YYYYDDD.HHMM.ppp.xml)
  // Gli elementi figli ereditano il namespace dal parent
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns2:FileQuadraturaFTP xmlns:ns2="http://www.fatturapa.it/sdi/ftp/v2.0" versione="2.0">
    <IdentificativoNodo>${idNodo}</IdentificativoNodo>
    <DataOraCreazione>${dataOraCreazione}</DataOraCreazione>
    <NomeSupporto>${nomeSupporto}</NomeSupporto>
    <NumeroFile>
        <File>
            <Tipo>FA</Tipo>
            <Numero>${numFatture}</Numero>
        </File>
    </NumeroFile>
</ns2:FileQuadraturaFTP>`;
  
  return xml;
}

/**
 * Carica certificato P12
 */
function loadP12Certificate(certPath, password) {
  const p12Der = fs.readFileSync(certPath, 'binary');
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
  
  const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  
  if (!keyBag || !certBag) {
    throw new Error('Certificato P12 non valido');
  }
  
  return {
    privateKey: keyBag.key,
    certificate: certBag.cert,
  };
}

/**
 * Carica certificato pubblico PEM
 */
function loadPublicCertificatePEM(certPath) {
  const certPEM = fs.readFileSync(certPath, 'utf8');
  return forge.pki.certificateFromPem(certPEM);
}

/**
 * Firma file con PKCS#7 usando OpenSSL (come da manuale SDI)
 * Il manuale suggerisce: openssl smime -sign -in DATA/dati -outform der -binary -nodetach -out DATA/dati.p7m -signer CERTS/FIRMA.PEM -passin pass:password
 * Prima estrae il PEM dal P12 come da manuale: openssl pkcs12 -in cert.p12 -out FIRMA.PEM
 */
async function signFileOpenSSL(fileBuffer, certPath, password) {
  const tempDir = '/tmp/sdi-sign';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const timestamp = Date.now();
  const inputFile = path.join(tempDir, `input_${timestamp}.tmp`);
  const outputFile = path.join(tempDir, `output_${timestamp}.p7m`);
  const pemFile = path.join(tempDir, `firma_${timestamp}.pem`);
  
  try {
    // Salva file input
    fs.writeFileSync(inputFile, fileBuffer);
    
    // Estrai certificato e chiave in formato PEM usando node-forge
    // (OpenSSL 3.0 non supporta PKCS12KDF per estrazione diretta)
    // Poi usa OpenSSL solo per la firma (garantisce ordine corretto attributi)
    const { privateKey, certificate } = loadP12Certificate(certPath, password);
    
    // Salva in formato PEM per OpenSSL
    const pemKey = forge.pki.privateKeyToPem(privateKey);
    const pemCert = forge.pki.certificateToPem(certificate);
    fs.writeFileSync(pemFile, pemKey + pemCert);
    
    // Esegui comando OpenSSL come da manuale
    // openssl smime -sign -in DATA/dati -outform der -binary -nodetach -out DATA/dati.p7m -signer CERTS/FIRMA.PEM
    const signCommand = `openssl smime -sign -in "${inputFile}" -outform der -binary -nodetach -out "${outputFile}" -signer "${pemFile}"`;
    
    await execAsync(signCommand, { maxBuffer: 10 * 1024 * 1024 });
    
    // Leggi file firmato
    const signedData = fs.readFileSync(outputFile);
    
    return signedData;
  } finally {
    // Pulisci file temporanei
    try {
      if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      if (fs.existsSync(pemFile)) fs.unlinkSync(pemFile);
    } catch (err) {
      console.error('[SIGN-OPENSSL] Errore pulizia file temp:', err.message);
    }
  }
}

/**
 * Firma file con PKCS#7 usando node-forge (versione alternativa)
 * ERRORE 00102: Signed attributes non ordinati
 * Test: rimuoviamo signingTime (opzionale) per vedere se risolve il problema
 */
async function signFileForge(fileBuffer, certPath, password) {
  const { privateKey, certificate } = loadP12Certificate(certPath, password);
  
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(fileBuffer.toString('binary'));
  p7.addCertificate(certificate);
  // ERRORE 00102: Signed attributes non ordinati
  // Secondo PKCS#7/CAdES-BES, gli attributi devono essere ordinati:
  // 1. contentType (obbligatorio)
  // 2. messageDigest (obbligatorio)
  // 3. signingTime (opzionale)
  // node-forge potrebbe non garantire l'ordine corretto.
  // Test: rimuoviamo signingTime (opzionale) per vedere se risolve il problema
  p7.addSigner({
    key: privateKey,
    certificate,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      // signingTime rimosso temporaneamente per test errore 00102
      // { type: forge.pki.oids.signingTime, value: new Date() },
    ],
  });
  
  p7.sign({ detached: false });
  const signedData = forge.asn1.toDer(p7.toAsn1()).getBytes();
  
  return Buffer.from(signedData, 'binary');
}

/**
 * Firma file con PKCS#7
 * Usa OpenSSL per default (come da manuale), fallback a node-forge
 */
async function signFile(fileBuffer, certPath, password, useOpenSSL = true) {
  if (useOpenSSL) {
    try {
      return await signFileOpenSSL(fileBuffer, certPath, password);
    } catch (error) {
      console.error('[SIGN] Errore OpenSSL, fallback a node-forge:', error.message);
      return await signFileForge(fileBuffer, certPath, password);
    }
  } else {
    return await signFileForge(fileBuffer, certPath, password);
  }
}

/**
 * Cifra file con PKCS#7 EnvelopedData completo
 * Formato conforme alle specifiche SDI
 */
async function encryptFile(fileBuffer, publicCertPath) {
  const publicCert = loadPublicCertificatePEM(publicCertPath);
  
  // Crea struttura PKCS#7 EnvelopedData
  const p7 = forge.pkcs7.createEnvelopedData();
  
  // Aggiungi certificato pubblico Sogei come destinatario
  p7.addRecipient(publicCert);
  
  // Imposta contenuto da cifrare
  p7.content = forge.util.createBuffer(fileBuffer.toString('binary'));
  
  // Cifra usando algoritmo conforme SDI
  // node-forge usa automaticamente:
  // - AES-256-CBC per cifrare il contenuto
  // - RSA-PKCS1-v1_5 per cifrare la chiave simmetrica (standard PKCS#7 v1.5)
  // - Formato PKCS#7 EnvelopedData standard ASN.1
  p7.encrypt();
  
  // Converte in formato DER (binary)
  const asn1 = p7.toAsn1();
  const der = forge.asn1.toDer(asn1);
  
  return Buffer.from(der.getBytes(), 'binary');
}

/**
 * Decifra file FO (PKCS#7 EnvelopedData)
 * I file FO sono cifrati con la nostra chiave pubblica, quindi usiamo la nostra chiave privata per decifrare
 */
async function decryptFile(encryptedBuffer, certPath, password) {
  try {
    // Carica certificato privato di cifratura
    const { privateKey, certificate } = loadP12Certificate(certPath, password);
    
    // Parse ASN.1 del file cifrato
    const asn1 = forge.asn1.fromDer(encryptedBuffer.toString('binary'));
    
    // Crea oggetto PKCS#7 EnvelopedData
    const p7 = forge.pkcs7.messageFromAsn1(asn1);
    
    if (!p7.recipients || p7.recipients.length === 0) {
      throw new Error('Nessun recipient trovato nel file cifrato');
    }
    
    // Prova a decifrare con ogni recipient fino a trovare quello corretto
    let decrypted = false;
    let lastError = null;
    
    for (const recipient of p7.recipients) {
      try {
        // Prova a decifrare con la nostra chiave privata
        p7.decrypt(recipient, privateKey);
        decrypted = true;
        break;
      } catch (err) {
        lastError = err;
        // Continua con il prossimo recipient
        continue;
      }
    }
    
    if (!decrypted) {
      throw new Error(`Impossibile decifrare con nessun recipient: ${lastError?.message || 'Errore sconosciuto'}`);
    }
    
    // Estrai contenuto decifrato (dovrebbe essere un file firmato PKCS#7 SignedData)
    const decryptedBuffer = Buffer.from(p7.content.getBytes(), 'binary');
    
    return decryptedBuffer;
  } catch (error) {
    console.error('[DECRYPT] Errore decifratura:', error);
    throw new Error(`Errore decifratura: ${error.message}`);
  }
}

/**
 * POST /api/sdi-sftp/send
 * Invia fatture via SFTP SDI
 */
app.post('/api/sdi-sftp/send', async (req, res) => {
  try {
    const { invoice_ids, org_id, test_mode } = req.body;

    if (!invoice_ids || !Array.isArray(invoice_ids) || invoice_ids.length === 0) {
      return res.status(400).json({ error: 'invoice_ids array richiesto' });
    }

    if (!org_id) {
      return res.status(400).json({ error: 'org_id richiesto' });
    }

    const useTestMode = test_mode ?? SFTP_CONFIG.testMode;

    // Carica fatture da Supabase
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .in('id', invoice_ids)
      .eq('org_id', org_id);

    if (invoicesError || !invoices || invoices.length === 0) {
      return res.status(404).json({ 
        error: 'Fatture non trovate', 
        details: invoicesError?.message 
      });
    }

    // Genera XML fatture (FatturaPA 1.2.2)
    // APPROCCIO 2: Firma ogni XML individualmente, poi ZIP, poi cifra ZIP
    // Secondo manuale FatturaPA par. 2.2 caso c: "ogni singolo file in esso contenuto" deve essere firmato
    const xmlFiles = [];
    // IdNodo: SEMPRE l'Id Nodo dell'accordo di servizio SDI-SFTP
    // Identifica il soggetto trasmittente (noi, RescueManager), NON il cedente
    const idNodoForFilename = process.env.SDI_ID_NODO || '02166430856';
    
    for (let index = 0; index < invoices.length; index++) {
      const invoice = invoices[index];
      const xmlContent = generateFatturaPA(invoice);
      
      // Progressivo: stringa alfanumerica max 5 caratteri [a-z], [A-Z], [0-9]
      // Formato conforme a SDI (paragrafo 2.2 manuale tecnico)
      let progressivo = String(invoice.number || (index + 1));
      // Rimuovi caratteri non alfanumerici e limita a 5 caratteri
      progressivo = progressivo.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5);
      // Se rimane vuoto o non conforme, usa progressivo sequenziale
      if (progressivo.length === 0 || !/^[a-zA-Z0-9]{1,5}$/.test(progressivo)) {
        progressivo = String(index + 1).padStart(5, '0').substring(0, 5);
      }
      
      // APPROCCIO 2: Firma ogni XML individualmente con PKCS#7 SignedData (CAdES-BES)
      // Il file firmato è in formato binario PKCS#7, estensione .xml.p7m
      // Usa OpenSSL per default (come da manuale), fallback a node-forge
      // Per testare entrambi gli approcci, possiamo usare variabile d'ambiente
      const useOpenSSL = process.env.SDI_USE_OPENSSL !== 'false'; // Default: true
      const xmlBuffer = Buffer.from(xmlContent, 'utf8');
      const signedXmlBuffer = await signFile(xmlBuffer, CERT_PATHS.firma, CERT_PATHS.password, useOpenSSL);
      
      // Nome file XML interno: IT{idNodo}_{progressivo}.xml.p7m
      // Estensione .xml.p7m per CAdES-BES (PKCS#7 SignedData)
      const filename = `IT${idNodoForFilename}_${progressivo}.xml.p7m`;
      xmlFiles.push({ filename, content: signedXmlBuffer });
    }

    if (!idNodoForFilename) {
      throw new Error('IdNodo non trovato nelle fatture');
    }

    // Genera nome file esterno (ZIP) - necessario per il file di quadratura
    const now = new Date();
    const progressivo = useTestMode 
      ? 900 + (Math.floor(now.getTime() / 1000) % 100) // Test: 900-999 (basato su secondi)
      : Math.floor((now.getTime() / 1000) % 900); // Produzione: 0-899 (basato su secondi)
    const filename = generateFIFilename(idNodoForFilename, progressivo, useTestMode);
    
    // Genera file FileQuadraturaFTP (deve essere incluso nello ZIP)
    // Nome file: stesso del ZIP ma con estensione .xml invece di .zip
    const nomeFileQuadratura = filename.replace('.zip', '.xml');
    const fileQuadraturaXML = generateFileQuadraturaFTP(
      idNodoForFilename,
      filename,
      invoices.length // Numero di fatture nel supporto
    );

    // APPROCCIO 2: Crea ZIP con FileQuadraturaFTP + XML firmati
    const zip = new AdmZip();
    // Aggiungi file di quadratura PRIMA (XML plain, non firmato)
    zip.addFile(nomeFileQuadratura, Buffer.from(fileQuadraturaXML, 'utf8'));
    // Aggiungi file XML fatture firmati
    xmlFiles.forEach(({ filename, content }) => {
      // content è già un Buffer (XML firmato PKCS#7)
      zip.addFile(filename, Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8'));
    });
    const zipBuffer = zip.toBuffer();

    // DEBUG: Salva copia ZIP plain per analisi (prima di cifrare)
    const debugDir = path.join(__dirname, 'debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    const debugZipPath = path.join(debugDir, `debug_${idNodoForFilename}_${Date.now()}.zip`);
    fs.writeFileSync(debugZipPath, zipBuffer);
    console.log(`[DEBUG] ZIP plain salvato per analisi: ${debugZipPath}`);

    // APPROCCIO 2B: Doppia Firma (XML individuali + ZIP)
    // Secondo manuale SFTP cap. 7: "supporti FI sottoposti a firma e cifratura"
    // Il manuale FatturaPA dice di firmare ogni XML (struttura contenuto)
    // Il manuale SFTP dice di firmare il supporto (trasmissione)
    // Quindi: Firma XML → ZIP → Firma ZIP → Cifra ZIP
    const signedZipBuffer = await signFile(zipBuffer, CERT_PATHS.firma, CERT_PATHS.password);
    const encryptedBuffer = await encryptFile(signedZipBuffer, CERT_PATHS.sogeiPublic);

    // filename già generato sopra (necessario per file di quadratura)

    // Upload SFTP
    const sftp = new SftpClient();
    const uploadDir = useTestMode ? 'DatiVersoSdITest' : 'DatiVersoSdI';
    
    try {
      await sftp.connect({
        host: SFTP_CONFIG.host,
        port: SFTP_CONFIG.port,
        username: SFTP_CONFIG.username,
        privateKey: SFTP_CONFIG.privateKey,
      });

      const remotePath = `${uploadDir}/${filename}`;
      await sftp.put(encryptedBuffer, remotePath);
      
      await sftp.end();

      // Aggiorna stato fatture dopo invio riuscito
      // Aggiorna tutte le fatture inviate con lo stato "sent" e le informazioni di invio
      const sentAt = new Date().toISOString();
      const envLabel = useTestMode ? "TEST" : "PRODUCTION";
      
      for (const invoice of invoices) {
        const baseMeta = invoice.meta || {};
        const updatedMeta = {
          ...baseMeta,
          sdi_sftp_filename: filename,
          sdi_sftp_sent_at: sentAt,
          sdi_sftp_test_mode: useTestMode,
          sdi_environment: envLabel,
          sdi_sent_at: sentAt,
          sdi: {
            ...(baseMeta.sdi || {}),
            trasmissione: {
              ...(baseMeta.sdi?.trasmissione || {}),
              ambiente: envLabel,
            },
          },
        };
        
        await supabase
          .from('invoices')
          .update({
            sdi_status: 'sent',
            meta: updatedMeta,
            // Usa il filename come riferimento temporaneo per identificativo SDI
            // L'identificativo SDI reale sarà disponibile quando SDI processa il file
            provider_ext_id: filename,
          })
          .eq('id', invoice.id);
      }
      
      console.log(`[SDI-SFTP-SERVER] Stato aggiornato a "sent" per ${invoice_ids.length} fattura/e`);

      res.json({
        success: true,
        filename,
        invoices_sent: invoice_ids.length,
        test_mode: useTestMode,
        // Per SDI-SFTP, l'identificativo SDI non è disponibile subito
        // Viene fornito quando SDI processa il file (polling/notifiche)
        // Usiamo il filename come riferimento temporaneo
        identificativo_sdi: filename, // Riferimento temporaneo (filename)
        message: 'File inviato via SFTP. L\'identificativo SDI sarà disponibile dopo l\'elaborazione da parte di SDI.',
      });

    } catch (sftpError) {
      await sftp.end();
      throw sftpError;
    }

  } catch (error) {
    console.error('[SDI-SFTP-SERVER] Errore:', error);
    res.status(500).json({ 
      error: 'Errore invio SFTP', 
      details: error.message 
    });
  }
});

/**
 * GET /api/sdi-sftp/files/incoming
 * Elenca i file FO (fatture passive ricevute)
 * Query params: test_mode (opzionale), limit (opzionale, default: 50)
 */
app.get('/api/sdi-sftp/files/incoming', async (req, res) => {
  try {
    const testMode = req.query.test_mode === 'true' || SFTP_CONFIG.testMode;
    const limit = parseInt(req.query.limit || '50', 10);
    const orgId = req.query.org_id;
    const downloadDir = testMode ? '/var/sftp/sdi/DatiDaSdITest' : '/var/sftp/sdi/DatiDaSdI';

    // Se orgId è fornito, recupera vat e tax_code dell'organizzazione
    let orgVat = null;
    let orgTaxCode = null;
    if (orgId) {
      try {
        const { data: org, error: orgError } = await supabase
          .from('orgs')
          .select('vat, tax_code')
          .eq('id', orgId)
          .single();
        
        if (!orgError && org) {
          orgVat = org.vat ? org.vat.replace(/[^0-9]/g, '') : null; // Rimuovi prefissi come "IT"
          orgTaxCode = org.tax_code ? org.tax_code.replace(/[^0-9A-Z]/g, '').toUpperCase() : null;
          console.log('[INCOMING] Org CF/PIVA:', { orgId, orgVat, orgTaxCode });
        } else {
          console.warn('[INCOMING] Organizzazione non trovata:', orgId, orgError);
        }
      } catch (orgErr) {
        console.error('[INCOMING] Errore recupero org:', orgErr.message);
      }
    }

    let filesFO = [];
    try {
      const files = fs.readdirSync(downloadDir);
      filesFO = files
        .filter(f => f.startsWith('FO.') && f.endsWith('.zip.p7m.enc'))
        .map(f => {
          const stats = fs.statSync(`${downloadDir}/${f}`);
          
          // Estrai identificativo destinatario dal nome file
          // Formato: FO.{IdCodiceDestinatario}.{Data}.{Ora}.{Progressivo}.zip.p7m.enc
          const parts = f.split('.');
          const recipientId = parts.length > 1 ? parts[1] : null; // Secondo campo è l'IdCodice del destinatario
          
          return {
            filename: f,
            size: stats.size,
            received_at: stats.mtime.toISOString(),
            status: 'unprocessed',
            recipient_id: recipientId // CF/PIVA del destinatario estratto dal nome file
          };
        })
        .filter(f => {
          // Se orgId è fornito, filtra solo i file destinati a questa organizzazione
          if (orgId && f.recipient_id) {
            // Se vat e tax_code non sono configurati, mostra tutti i file (utente deve configurarli)
            if (!orgVat && !orgTaxCode) {
              console.warn(`[INCOMING] Org ${orgId} non ha vat/tax_code configurati. Mostrando tutti i file. Configura vat/tax_code per filtrare correttamente.`);
              return true; // Mostra tutti i file se vat/tax_code non sono configurati
            }
            
            const recipientId = f.recipient_id.replace(/[^0-9A-Z]/g, '').toUpperCase();
            // Confronta con vat (solo numeri) o tax_code (solo alfanumerici)
            const matchesVat = orgVat && recipientId === orgVat;
            const matchesTaxCode = orgTaxCode && recipientId === orgTaxCode;
            // Se vat è lungo 11 cifre (P.IVA italiana) o tax_code è lungo 16 caratteri (CF italiano)
            // Confronta anche senza prefisso paese
            const matchesVatNoPrefix = orgVat && recipientId.endsWith(orgVat) && orgVat.length >= 9;
            const matchesTaxCodeNoPrefix = orgTaxCode && recipientId.endsWith(orgTaxCode) && orgTaxCode.length >= 11;
            
            const matches = matchesVat || matchesTaxCode || matchesVatNoPrefix || matchesTaxCodeNoPrefix;
            if (!matches) {
              console.log(`[INCOMING] File ${f.filename} scartato: recipient_id ${recipientId} non corrisponde a org (vat: ${orgVat}, tax_code: ${orgTaxCode})`);
            }
            return matches;
          }
          return true; // Se orgId non è fornito, mostra tutti i file
        })
        .sort((a, b) => new Date(b.received_at) - new Date(a.received_at))
        .slice(0, limit);
    } catch (err) {
      console.error('[INCOMING] Errore lettura download dir:', err.message);
      return res.status(500).json({
        error: 'Errore lettura directory',
        details: err.message
      });
    }

    res.json({
      test_mode: testMode,
      files: filesFO,
      summary: {
        total_count: filesFO.length,
        unprocessed_count: filesFO.filter(f => f.status === 'unprocessed').length
      },
      filtered_by_org: !!orgId
    });

  } catch (error) {
    console.error('[INCOMING] Errore:', error);
    res.status(500).json({
      error: 'Errore elenco file incoming',
      details: error.message
    });
  }
});

/**
 * GET /api/sdi-sftp/files/incoming/:filename/download
 * Scarica un file FO (cifrato)
 */
app.get('/api/sdi-sftp/files/incoming/:filename/download', async (req, res) => {
  try {
    const filename = req.params.filename;
    if (!filename.startsWith('FO.') || !filename.endsWith('.zip.p7m.enc')) {
      return res.status(400).json({
        error: 'Nome file non valido. Deve iniziare con "FO." e terminare con ".zip.p7m.enc"'
      });
    }

    const testMode = req.query.test_mode === 'true' || SFTP_CONFIG.testMode;
    const downloadDir = testMode ? '/var/sftp/sdi/DatiDaSdITest' : '/var/sftp/sdi/DatiDaSdI';
    const filePath = path.join(downloadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File non trovato',
        filename
      });
    }

    const fileBuffer = fs.readFileSync(filePath);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('[INCOMING-DOWNLOAD] Errore:', error);
    res.status(500).json({
      error: 'Errore download file',
      details: error.message
    });
  }
});

/**
 * POST /api/sdi-sftp/files/incoming/:filename/decrypt
 * Decifra un file FO ed estrae il contenuto XML
 */
app.post('/api/sdi-sftp/files/incoming/:filename/decrypt', async (req, res) => {
  try {
    const filename = req.params.filename;
    if (!filename.startsWith('FO.') || !filename.endsWith('.zip.p7m.enc')) {
      return res.status(400).json({
        error: 'Nome file non valido. Deve iniziare con "FO." e terminare con ".zip.p7m.enc"'
      });
    }

    const testMode = req.query.test_mode === 'true' || SFTP_CONFIG.testMode;
    const downloadDir = testMode ? '/var/sftp/sdi/DatiDaSdITest' : '/var/sftp/sdi/DatiDaSdI';
    const filePath = path.join(downloadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File non trovato',
        filename
      });
    }

    // 1. Leggi file cifrato
    const encryptedBuffer = fs.readFileSync(filePath);
    
    // 2. Decifra con certificato privato di cifratura
    // I file FO sono cifrati con la nostra chiave pubblica, quindi usiamo la nostra chiave privata
    const decryptedBuffer = await decryptFile(encryptedBuffer, CERT_PATHS.cifra, CERT_PATHS.password);
    console.log('[INCOMING-DECRYPT] Buffer decifrato:', decryptedBuffer.length, 'bytes');
    
    // 3. Estrai ZIP dal file decifrato (che dovrebbe essere un file firmato PKCS#7)
    // Nota: Il file decifrato potrebbe essere ancora firmato (PKCS#7 SignedData)
    // Usiamo OpenSSL per estrarre il contenuto dal SignedData
    
    // Verifica magic number del buffer decifrato
    const magicBytes = decryptedBuffer.slice(0, 4);
    const magicHex = magicBytes.toString('hex');
    console.log('[INCOMING-DECRYPT] Magic number buffer decifrato (hex):', magicHex);
    
    // Prova a estrarre il contenuto usando OpenSSL (più affidabile per SignedData)
    let zipBuffer = decryptedBuffer;
    try {
      // Verifica se è un PKCS#7 SignedData controllando il magic number ASN.1
      // ASN.1 SEQUENCE inizia con 0x30
      if (magicBytes[0] === 0x30) {
        console.log('[INCOMING-DECRYPT] Rilevato PKCS#7, uso OpenSSL per estrarre contenuto');
        
        // Salva buffer decifrato in file temporaneo
        const tempDir = '/tmp/sdi-decrypt';
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const inputFile = path.join(tempDir, `signed_${timestamp}.p7m`);
        const outputFile = path.join(tempDir, `extracted_${timestamp}.zip`);
        
        try {
          // Scrivi buffer decifrato (PKCS#7 SignedData)
          fs.writeFileSync(inputFile, decryptedBuffer);
          
          // Usa OpenSSL per verificare la firma e estrarre il contenuto
          // openssl smime -verify -in signed.p7m -inform DER -noverify -out extracted.zip
          // -noverify: non verifica la catena di certificati (solo estrae contenuto)
          const verifyCommand = `openssl smime -verify -in "${inputFile}" -inform DER -noverify -out "${outputFile}" -noverify 2>&1`;
          
          console.log('[INCOMING-DECRYPT] Esecuzione OpenSSL:', verifyCommand);
          const { stdout, stderr } = await execAsync(verifyCommand, { maxBuffer: 10 * 1024 * 1024 });
          
          if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
            zipBuffer = fs.readFileSync(outputFile);
            console.log('[INCOMING-DECRYPT] Contenuto estratto con OpenSSL:', zipBuffer.length, 'bytes');
            console.log('[INCOMING-DECRYPT] Magic number ZIP estratto (hex):', zipBuffer.slice(0, 4).toString('hex'));
            console.log('[INCOMING-DECRYPT] Magic number ZIP estratto (ASCII):', zipBuffer.slice(0, 2).toString('ascii'));
          } else {
            throw new Error('OpenSSL non ha estratto il contenuto (file output vuoto o non esistente)');
          }
          
          // Pulisci file temporanei
          try {
            if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
          } catch (cleanErr) {
            console.warn('[INCOMING-DECRYPT] Errore pulizia file temp:', cleanErr.message);
          }
          
        } catch (opensslErr) {
          console.error('[INCOMING-DECRYPT] Errore OpenSSL:', opensslErr.message);
          // Pulisci file temporanei anche in caso di errore
          try {
            if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
          } catch {}
          
          // Se OpenSSL fallisce, prova con node-forge come fallback
          console.log('[INCOMING-DECRYPT] OpenSSL fallito, provo node-forge come fallback');
          throw opensslErr;
        }
      } else {
        // Non è un PKCS#7, probabilmente è già lo ZIP
        console.log('[INCOMING-DECRYPT] Non sembra essere PKCS#7, uso buffer decifrato direttamente');
      }
    } catch (err) {
      // Fallback: prova con node-forge se OpenSSL fallisce
      console.log('[INCOMING-DECRYPT] Errore estrazione con OpenSSL/node-forge:', err.message);
      try {
        const asn1Signed = forge.asn1.fromDer(decryptedBuffer.toString('binary'));
        const p7Signed = forge.pkcs7.messageFromAsn1(asn1Signed);
        console.log('[INCOMING-DECRYPT] Tipo PKCS#7 (fallback):', p7Signed.type);
        
        // L'OID per signedData è 1.2.840.113549.1.7.2
        const isSignedData = p7Signed.type === 'signedData' || 
                             p7Signed.type === forge.pkcs7.asn1.signedData ||
                             (typeof p7Signed.type === 'string' && p7Signed.type.includes('1.2.840.113549.1.7.2'));
        
        if (isSignedData) {
        // Estrai contenuto dal SignedData (dovrebbe essere il ZIP)
        // In node-forge, p7Signed.content è un ByteBuffer
        let contentBytes;
        try {
          if (p7Signed.content) {
            // p7Signed.content è un ByteBuffer
            if (p7Signed.content instanceof forge.util.ByteBuffer) {
              contentBytes = p7Signed.content.getBytes('binary');
            } else if (typeof p7Signed.content === 'string') {
              contentBytes = p7Signed.content;
            } else if (p7Signed.content.getBytes) {
              contentBytes = p7Signed.content.getBytes('binary');
            } else {
              // Prova a ottenere come array di byte
              const bytes = p7Signed.content.bytes || p7Signed.content.data;
              if (bytes) {
                contentBytes = String.fromCharCode.apply(null, bytes);
              } else {
                contentBytes = String(p7Signed.content);
              }
            }
          } else {
            // Se content non è disponibile, prova a estrarre dall'ASN.1 direttamente
            console.log('[INCOMING-DECRYPT] p7Signed.content non disponibile, provo estrazione alternativa');
            // Il contenuto è nel campo encapContentInfo.eContent
            // Usa il metodo rawCapture se disponibile
            throw new Error('Contenuto non disponibile tramite content');
          }
          
          if (contentBytes && contentBytes.length > 0) {
            zipBuffer = Buffer.from(contentBytes, 'binary');
            console.log('[INCOMING-DECRYPT] Estratto da SignedData:', zipBuffer.length, 'bytes');
            console.log('[INCOMING-DECRYPT] Magic number ZIP estratto (hex):', zipBuffer.slice(0, 4).toString('hex'));
            console.log('[INCOMING-DECRYPT] Magic number ZIP estratto (ASCII):', zipBuffer.slice(0, 2).toString('ascii'));
          } else {
            throw new Error('Contenuto estratto è vuoto o non valido');
          }
        } catch (extractErr) {
          console.error('[INCOMING-DECRYPT] Errore estrazione contenuto SignedData:', extractErr.message);
          // Se l'estrazione fallisce, usa il buffer decifrato originale
          console.log('[INCOMING-DECRYPT] Uso buffer decifrato originale come ZIP');
        }
          // Prova a estrarre contenuto con node-forge (fallback)
          if (p7Signed.content instanceof forge.util.ByteBuffer) {
            zipBuffer = Buffer.from(p7Signed.content.getBytes('binary'), 'binary');
            console.log('[INCOMING-DECRYPT] Contenuto estratto con node-forge:', zipBuffer.length, 'bytes');
          } else {
            throw new Error('p7Signed.content non è un ByteBuffer');
          }
        } else {
          console.log('[INCOMING-DECRYPT] File decifrato non è SignedData, tipo:', p7Signed.type);
        }
      } catch (forgeErr) {
        console.error('[INCOMING-DECRYPT] Errore estrazione con node-forge:', forgeErr.message);
        // Ultimo fallback: usa buffer decifrato direttamente
        console.log('[INCOMING-DECRYPT] Uso buffer decifrato originale come ZIP (ultimo fallback)');
        zipBuffer = decryptedBuffer;
        
        // Verifica che sia effettivamente uno ZIP (magic number: PK)
        if (zipBuffer.length >= 2) {
          const magic = zipBuffer.slice(0, 2).toString('ascii');
          console.log('[INCOMING-DECRYPT] Magic bytes buffer originale (ASCII):', magic);
          if (magic !== 'PK') {
            console.warn('[INCOMING-DECRYPT] Contenuto decifrato non sembra essere uno ZIP (magic:', magic, ')');
          }
        }
      }
    }
    
    // 4. Estrai XML dal ZIP
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();
    
    const xmlFiles = [];
    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.xml') && !entry.entryName.includes('FileQuadraturaFTP')) {
        const xmlContent = entry.getData().toString('utf8');
        
        // Determina il tipo di file XML
        let fileType = 'fattura'; // default
        if (xmlContent.includes('RicevutaScarto')) {
          fileType = 'notifica_scarto';
        } else if (xmlContent.includes('NotificaDecorrenzaTermini')) {
          fileType = 'notifica_decorrenza';
        } else if (xmlContent.includes('NotificaEsitoCommittente')) {
          fileType = 'notifica_esito';
        } else if (xmlContent.includes('FatturaElettronica')) {
          fileType = 'fattura';
        } else if (xmlContent.includes('FileQuadraturaFTP')) {
          fileType = 'quadratura';
        }
        
        xmlFiles.push({
          name: entry.entryName,
          content: xmlContent,
          size: entry.header.size,
          type: fileType
        });
      }
    }
    
    if (xmlFiles.length === 0) {
      return res.status(400).json({
        error: 'Nessun file XML trovato nel ZIP',
        filename
      });
    }
    
    // 5. Estrai dati fattura dal primo XML (se disponibile)
    let invoiceData = null;
    if (xmlFiles.length > 0) {
      try {
        // Parse XML per estrarre dati base (da implementare meglio se necessario)
        const xmlContent = xmlFiles[0].content;
        // Placeholder per estrazione dati fattura
        invoiceData = {
          numero: 'N/A', // Da estrarre dall'XML
          data: 'N/A', // Da estrarre dall'XML
          importo_totale: 0 // Da estrarre dall'XML
        };
      } catch (err) {
        console.warn('[DECRYPT] Errore parsing XML per estrarre dati fattura:', err.message);
      }
    }
    
    res.json({
      success: true,
      filename,
      xml_files: xmlFiles,
      invoice_data: invoiceData
    });

  } catch (error) {
    console.error('[INCOMING-DECRYPT] Errore:', error);
    res.status(500).json({
      error: 'Errore decifratura file',
      details: error.message
    });
  }
});

// Avvia server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[SDI-SFTP-SERVER] Server avviato su porta ${PORT}`);
  console.log(`[SDI-SFTP-SERVER] Test mode: ${SFTP_CONFIG.testMode}`);
});

