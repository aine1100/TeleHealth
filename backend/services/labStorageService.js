const path = require('path');
const fs = require('fs');
const { uploadFileToR2 } = require('./r2Service');

const LOCAL_UPLOAD_ROOT = path.join(__dirname, '../uploads/lab');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

exports.uploadLabReport = async (file, labId) => {
  if (!file?.buffer) {
    const error = new Error('Report file is required');
    error.statusCode = 400;
    throw error;
  }

  const safeName = String(file.originalname || 'report')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80);
  const fileName = `${Date.now()}-${safeName}`;
  const key = `lab/${labId}/${fileName}`;

  try {
    return await uploadFileToR2(file, key);
  } catch {
    const dir = path.join(LOCAL_UPLOAD_ROOT, String(labId));
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, fileName), file.buffer);
    return `/uploads/lab/${labId}/${fileName}`;
  }
};
