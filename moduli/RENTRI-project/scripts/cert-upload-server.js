#!/usr/bin/env node
/**
 * RENTRI Certificate Upload Server
 * Endpoint per estrarre certificati .p12 usando OpenSSL
 * Deploy su VPS 217.154.118.37
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const { writeFile, unlink, readFile } = require('fs/promises');
const { tmpdir } = require('os');
const { join } = require('path');

const execAsync = promisify(exec);
const app = express();
const PORT = 3456;

/**
 * Pulisce PEM da Bag Attributes e metadati OpenSSL
 * Ritorna solo il blocco BEGIN/END con contenuto base64
 */
function cleanPEM(pemContent, type) {
  // Trova il blocco BEGIN...END
  const beginMarker = `-----BEGIN ${type}-----`;
  const endMarker = `-----END ${type}-----`;
  
  const beginIndex = pemContent.indexOf(beginMarker);
  const endIndex = pemContent.indexOf(endMarker);
  
  if (beginIndex === -1 || endIndex === -1) {
    throw new Error(`Marcatori ${type} non trovati nel PEM`);
  }
  
  // Estrai solo il blocco del certificato/chiave
  const cleanContent = pemContent.substring(beginIndex, endIndex + endMarker.length);
  
  return cleanContent.trim();
}

// CORS configurato per app desktop
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'app://.', 'https://rescuemanager.eu'],
  credentials: true
}));

app.use(express.json());

// Configurazione multer per upload file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.p12') || file.originalname.endsWith('.pfx')) {
      cb(null, true);
    } else {
      cb(new Error('Solo file .p12 o .pfx sono ammessi'));
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rentri-cert-upload', timestamp: new Date().toISOString() });
});

// Endpoint principale per upload certificato
app.post('/upload-cert', upload.single('p12_file'), async (req, res) => {
  const { password } = req.body;
  const p12File = req.file;
  
  let tempP12 = null;
  let tempCert = null;
  let tempKey = null;
  
  try {
    console.log('[CERT-UPLOAD] Richiesta ricevuta');
    
    // Validazione
    if (!p12File) {
      return res.status(400).json({ error: 'File .p12 mancante' });
    }
    
    if (!password) {
      return res.status(400).json({ error: 'Password mancante' });
    }
    
    console.log('[CERT-UPLOAD] File ricevuto:', {
      name: p12File.originalname,
      size: p12File.size
    });
    
    // Salva file temporaneo
    const tempDir = tmpdir();
    const timestamp = Date.now();
    tempP12 = join(tempDir, `cert_${timestamp}.p12`);
    tempCert = join(tempDir, `cert_${timestamp}.pem`);
    tempKey = join(tempDir, `key_${timestamp}.pem`);
    
    await writeFile(tempP12, p12File.buffer);
    console.log('[CERT-UPLOAD] File temporaneo salvato:', tempP12);
    
    // Estrai certificato con OpenSSL
    console.log('[CERT-UPLOAD] Estrazione certificato...');
    const escapedPassword = password.replace(/'/g, "'\\''");
    const certCmd = `openssl pkcs12 -in "${tempP12}" -clcerts -nokeys -out "${tempCert}" -passin pass:'${escapedPassword}' 2>&1`;
    
    try {
      const { stdout: certOut } = await execAsync(certCmd);
      if (certOut.includes('invalid') || certOut.includes('error') || certOut.includes('Error')) {
        throw new Error('Password errata o file .p12 non valido');
      }
      console.log('[CERT-UPLOAD] Certificato estratto');
    } catch (error) {
      console.error('[CERT-UPLOAD] Errore estrazione certificato:', error.message);
      return res.status(400).json({
        error: 'Password errata o file .p12 corrotto',
        details: error.message
      });
    }
    
    // Estrai chiave privata con OpenSSL
    console.log('[CERT-UPLOAD] Estrazione chiave privata...');
    const keyCmd = `openssl pkcs12 -in "${tempP12}" -nocerts -nodes -out "${tempKey}" -passin pass:'${escapedPassword}' 2>&1`;
    
    try {
      const { stdout: keyOut } = await execAsync(keyCmd);
      if (keyOut.includes('invalid') || keyOut.includes('error') || keyOut.includes('Error')) {
        throw new Error('Impossibile estrarre chiave privata');
      }
      console.log('[CERT-UPLOAD] Chiave privata estratta');
    } catch (error) {
      console.error('[CERT-UPLOAD] Errore estrazione chiave:', error.message);
      return res.status(400).json({
        error: 'Impossibile estrarre chiave privata',
        details: error.message
      });
    }
    
    // Leggi certificato e chiave
    let certificatePem = await readFile(tempCert, 'utf-8');
    let privateKeyPem = await readFile(tempKey, 'utf-8');
    
    console.log('[CERT-UPLOAD] Certificato PEM letto, lunghezza:', certificatePem.length);
    console.log('[CERT-UPLOAD] Chiave PEM letta, lunghezza:', privateKeyPem.length);
    
    // Pulisci certificato: rimuovi Bag Attributes e metadati
    certificatePem = cleanPEM(certificatePem, 'CERTIFICATE');
    privateKeyPem = cleanPEM(privateKeyPem, 'PRIVATE KEY');
    
    console.log('[CERT-UPLOAD] Certificato pulito, lunghezza:', certificatePem.length);
    console.log('[CERT-UPLOAD] Chiave pulita, lunghezza:', privateKeyPem.length);
    
    // Verifica validità
    if (!certificatePem.includes('BEGIN CERTIFICATE') || !privateKeyPem.includes('BEGIN')) {
      return res.status(400).json({ error: 'Certificato o chiave estratti non validi' });
    }
    
    // Estrai date validità
    const datesCmd = `openssl x509 -in "${tempCert}" -noout -dates 2>&1`;
    const { stdout: datesOut } = await execAsync(datesCmd);
    
    const notBeforeMatch = datesOut.match(/notBefore=(.+)/);
    const notAfterMatch = datesOut.match(/notAfter=(.+)/);
    
    const issuedAt = notBeforeMatch ? new Date(notBeforeMatch[1]) : new Date();
    const expiresAt = notAfterMatch ? new Date(notAfterMatch[1]) : new Date(Date.now() + 730 * 24 * 60 * 60 * 1000);
    
    console.log('[CERT-UPLOAD] Date estratte:', {
      issued: issuedAt,
      expires: expiresAt
    });
    
    // Pulizia file temporanei
    try {
      await unlink(tempP12);
      await unlink(tempCert);
      await unlink(tempKey);
      console.log('[CERT-UPLOAD] File temporanei rimossi');
    } catch (cleanupError) {
      console.warn('[CERT-UPLOAD] Errore pulizia:', cleanupError.message);
    }
    
    // Ritorna certificato e chiave al frontend
    res.json({
      success: true,
      certificate_pem: certificatePem,
      private_key_pem: privateKeyPem,
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      message: 'Certificato estratto con successo'
    });
    
  } catch (error) {
    console.error('[CERT-UPLOAD] Errore:', error);
    
    // Pulizia file temporanei in caso di errore
    try {
      if (tempP12) await unlink(tempP12);
      if (tempCert) await unlink(tempCert);
      if (tempKey) await unlink(tempKey);
    } catch (cleanupError) {
      console.warn('[CERT-UPLOAD] Errore pulizia:', cleanupError.message);
    }
    
    res.status(500).json({
      error: 'Errore interno server',
      details: error.message
    });
  }
});

// Gestione errori multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File troppo grande (max 10MB)' });
    }
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ RENTRI Certificate Upload Server listening on port ${PORT}`);
  console.log(`📍 http://217.154.118.37:${PORT}`);
  console.log(`🔍 Health check: http://217.154.118.37:${PORT}/health`);
});

