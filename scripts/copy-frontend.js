const path = require('path');
const fs = require('fs');

const source = path.join(__dirname, '../frontend/build');
const dest = path.join(__dirname, '../backend/public');

if (!fs.existsSync(source)) {
  console.error('Frontend build not found at', source);
  console.error('Run: npm run build --prefix frontend');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(source, dest, { recursive: true });
console.log('Copied frontend build → backend/public');
