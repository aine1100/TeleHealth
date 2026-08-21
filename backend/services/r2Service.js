const AWS = require('aws-sdk');

let s3Client = null;

const isPlaceholderValue = (value) => {
  if (!value) return true;
  const normalized = String(value).trim().toLowerCase();
  return normalized.includes('your-') || normalized.includes('example') || normalized.includes('changeme');
};

const getS3Client = () => {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (isPlaceholderValue(accessKeyId) || isPlaceholderValue(secretAccessKey)) {
    throw new Error('Cloudflare R2 credentials are not configured. Set real R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY values from your Cloudflare R2 API token.');
  }

  if (!s3Client) {
    s3Client = new AWS.S3({
      endpoint: process.env.R2_ENDPOINT,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      region: process.env.R2_REGION || 'auto',
      signatureVersion: 'v4'
    });
  }
  return s3Client;
};

/** Public CDN base for browser-accessible objects (r2.dev or custom domain). */
exports.getR2PublicBaseUrl = () => {
  const base = (process.env.R2_PUBLIC_URL || '').trim().replace(/\/$/, '');
  return base || null;
};

/**
 * Build a browser-ready public URL for an object key.
 * Prefer R2_PUBLIC_URL — S3 Location points at the private API endpoint.
 */
exports.buildR2PublicUrl = (key) => {
  const base = exports.getR2PublicBaseUrl();
  if (!base) {
    throw new Error('R2_PUBLIC_URL is not configured. Set it to your public R2 URL (e.g. https://pub-….r2.dev).');
  }
  const cleanKey = String(key || '')
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${base}/${cleanKey}`;
};

exports.uploadFileToR2 = async (file, key) => {
  if (!process.env.R2_ENDPOINT || !process.env.R2_BUCKET_NAME) {
    throw new Error('Cloudflare R2 is not configured');
  }
  if (!exports.getR2PublicBaseUrl()) {
    throw new Error('R2_PUBLIC_URL is not configured');
  }

  const s3 = getS3Client();
  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  await s3.upload(params).promise();
  return exports.buildR2PublicUrl(key);
};
