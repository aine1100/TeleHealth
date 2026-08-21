const path = require('path');
const { v4: uuidv4 } = require('uuid');

exports.buildStorageKey = (folder, originalName) => {
  const ext = path.extname(originalName) || '.bin';
  return `${folder}/${uuidv4()}${ext}`;
};

/** Join a public bucket/CDN base URL with an object key (no double slashes). */
exports.buildPublicUrl = (bucketBaseUrl, key) => {
  if (!bucketBaseUrl || !key) return null;
  const base = String(bucketBaseUrl).replace(/\/$/, '');
  const cleanKey = String(key)
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${base}/${cleanKey}`;
};
