/**
 * Client R2 (Cloudflare) via API S3. Credenziali da /root/.env:
 * R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.
 */
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

const ACCOUNT = process.env.R2_ACCOUNT_ID;
// Bucket DEDICATO ai backup (non riusa R2_BUCKET_NAME degli altri servizi).
const BUCKET = process.env.BACKUP_BUCKET || process.env.R2_BUCKET_NAME;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function put(key, body, contentType) {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));
}

async function listKeys(prefix) {
  const keys = [];
  let token;
  do {
    const r = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }));
    (r.Contents || []).forEach((o) => keys.push(o.Key));
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function deleteKeys(keys) {
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000).map((Key) => ({ Key }));
    await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: chunk } }));
  }
}

module.exports = { put, listKeys, deleteKeys, BUCKET, configured: () => !!(ACCOUNT && BUCKET && process.env.R2_ACCESS_KEY_ID) };
