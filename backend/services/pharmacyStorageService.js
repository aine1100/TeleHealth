const fs = require('fs');
const path = require('path');
const { buildStorageKey } = require('./storageService');
const { uploadFileToR2 } = require('./r2Service');

const LOCAL_UPLOAD_ROOT = path.join(__dirname, '../uploads/pharmacy');

const saveLocal = (file, pharmacyId) => {
  const dir = path.join(LOCAL_UPLOAD_ROOT, String(pharmacyId));
  fs.mkdirSync(dir, { recursive: true });
  const fileName = buildStorageKey('', file.originalname).replace(/^\//, '');
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/pharmacy/${pharmacyId}/${fileName}`;
};

exports.uploadPharmacyImage = async (file, pharmacyId) => {
  if (!file?.buffer) {
    const error = new Error('Image file is required');
    error.statusCode = 400;
    throw error;
  }

  try {
    const key = buildStorageKey(`pharmacy/${pharmacyId}`, file.originalname);
    return await uploadFileToR2(file, key);
  } catch {
    return saveLocal(file, pharmacyId);
  }
};
