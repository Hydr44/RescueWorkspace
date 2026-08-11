/**
 * Lettura backup su R2 (Cloudflare) per il pannello admin: elenco + link firmati.
 * Credenziali da /root/.env; bucket = BACKUP_BUCKET (dedicato ai backup).
 */
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const ACCOUNT = process.env.R2_ACCOUNT_ID;
const BUCKET = process.env.BACKUP_BUCKET || process.env.R2_BUCKET_NAME;

const s3 = ACCOUNT
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${ACCOUNT}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

function configured() {
  return !!(s3 && BUCKET && process.env.R2_ACCESS_KEY_ID);
}

async function listAll(prefix) {
  const out = [];
  let token;
  do {
    const r = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }));
    (r.Contents || []).forEach((o) => out.push({ key: o.Key, size: o.Size || 0, mtime: o.LastModified }));
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return out;
}

async function presign(key, expiresIn = 120) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

module.exports = { configured, listAll, presign, BUCKET };
