const path = require('path');
const { v4: uuidv4 } = require('uuid');

exports.buildStorageKey = (folder, originalName) => {
  const ext = path.extname(originalName) || '.bin';
  return `${folder}/${uuidv4()}${ext}`;
};

exports.buildPublicUrl = (bucketBaseUrl, key) => {
  if (!bucketBaseUrl) return null;
  return `${bucketBaseUrl.replace(/\/$/, '')}/${key}`;
};
