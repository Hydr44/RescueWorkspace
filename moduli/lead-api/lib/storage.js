/**
 * Cloudflare R2 Storage Client
 * Upload PDF preventivi e gestione file
 */

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'rescuemanager-quotes';

// Client S3 compatibile per R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload PDF su R2
 * @param {Buffer} pdfBuffer - Buffer del PDF
 * @param {string} filename - Nome file (es. QUOTE-202603-001.pdf)
 * @param {object} metadata - Metadata opzionali
 * @returns {Promise<string>} URL pubblico del file
 */
async function uploadQuotePDF(pdfBuffer, filename, metadata = {}) {
  const key = `quotes/${filename}`;
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
    Metadata: {
      'upload-date': new Date().toISOString(),
      ...metadata,
    },
  });

  await r2Client.send(command);

  // R2 public URL (se bucket è pubblico)
  const publicUrl = `https://quotes.rescuemanager.eu/${key}`;
  
  return publicUrl;
}

/**
 * Genera URL firmato temporaneo per download privato
 * @param {string} filename - Nome file
 * @param {number} expiresIn - Secondi di validità (default 1 ora)
 * @returns {Promise<string>} URL firmato
 */
async function getSignedQuoteUrl(filename, expiresIn = 3600) {
  const key = `quotes/${filename}`;
  
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
  return signedUrl;
}

/**
 * Upload generico su R2
 * @param {Buffer} buffer - Buffer del file
 * @param {string} key - Chiave/path del file
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} URL pubblico
 */
async function uploadFile(buffer, key, contentType = 'application/octet-stream') {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);
  return `https://quotes.rescuemanager.eu/${key}`;
}

module.exports = {
  uploadQuotePDF,
  getSignedQuoteUrl,
  uploadFile,
  r2Client,
};
