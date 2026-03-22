const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const HOST = 'sdi.rescuemanager.eu';
const PATH = '/api/sdi/ricezione';
const CERT_PATH = 'SDI-project/nuovi cer/CER_CLIENT_IT02166430856.pem';
const KEY_PATH = 'SDI-project/sdi_emmanuel_scozzarini.key';
const CA_PATH = 'SDI-project/KitDiTest/certificati/caentrate.cer'; // Trust Prod CA for Server Cert

// Verify files exist
if (!fs.existsSync(CERT_PATH)) { console.error('Missing CERT:', CERT_PATH); process.exit(1); }
if (!fs.existsSync(KEY_PATH)) { console.error('Missing KEY:', KEY_PATH); process.exit(1); }
if (!fs.existsSync(CA_PATH)) { console.error('Missing CA:', CA_PATH); process.exit(1); }

// Load certs
const cert = fs.readFileSync(CERT_PATH);
const key = fs.readFileSync(KEY_PATH);
const ca = fs.readFileSync(CA_PATH);

// SOAP Request Body (Example from Kit or minimal valid SOAP)
const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v1="http://www.fatturapa.gov.it/sdi/ws/ricezione/v1.0/types">
   <soapenv:Header/>
   <soapenv:Body>
      <v1:RiceviFatture>
         <IdentificativoSdI>123456789</IdentificativoSdI>
         <fileSdIConMetadati>
            <IdentificativoSdI>123456789</IdentificativoSdI>
            <NomeFile>IT01234567890_11111.xml</NomeFile>
            <File>PEZhdHR1cmFFbGV0dHJvbmljYT48L0ZhdHR1cmFFbGV0dHJvbmljYT4=</File>
            <Metadati>UEsDBBQAAAAIAAAAAAAAAAAAAAAAAAAAAAA=</Metadati>
   </fileSdIConMetadati>
      </v1:RiceviFatture>
   </soapenv:Body>
</soapenv:Envelope>`;

const options = {
    hostname: HOST,
    port: 443,
    path: PATH,
    method: 'POST',
    cert: cert,
    key: key,
    ca: ca, // Trust the server cert signed by Prod CA
    rejectUnauthorized: false, // For testing, we can disable if hostname mismatch, but let's try strict first
    headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Content-Length': Buffer.byteLength(soapBody),
        'SOAPAction': 'RiceviFatture'
    }
};

console.log('Sending SOAP request to', HOST + PATH);
console.log('Using Client Cert:', CERT_PATH);

const req = https.request(options, (res) => {
    console.log('StatusCode:', res.statusCode);
    console.log('Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Body:', data);
    });
});

req.on('error', (e) => {
    console.error('Error:', e);
});

req.write(soapBody);
req.end();
