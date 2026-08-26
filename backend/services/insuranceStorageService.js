const path = require('path');
const fs = require('fs');
const { uploadFileToR2 } = require('./r2Service');

const LOCAL_UPLOAD_ROOT = path.join(__dirname, '../uploads/insurance');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const localUrl = (insurerOrPatientId, fileName) => `/uploads/insurance/${insurerOrPatientId}/${fileName}`;

exports.uploadInsuranceDocument = async (file, ownerId) => {
  if (!file?.buffer) {
    const error = new Error('Document file is required');
    error.statusCode = 400;
    throw error;
  }

  const safeName = String(file.originalname || 'document')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80);
  const fileName = `${Date.now()}-${safeName}`;
  const key = `insurance/${ownerId}/${fileName}`;

  try {
    return await uploadFileToR2(file, key);
  } catch {
    const dir = path.join(LOCAL_UPLOAD_ROOT, String(ownerId));
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, fileName), file.buffer);
    return localUrl(ownerId, fileName);
  }
};
