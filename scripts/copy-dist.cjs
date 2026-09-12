const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'frontend', 'frontend', 'dist');
const destPublic = path.join(rootDir, 'backend', 'backend', 'public');
const destDistPublic = path.join(rootDir, 'backend', 'backend', 'dist', 'public');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

try {
  copyRecursive(srcDir, destPublic);
  copyRecursive(srcDir, destDistPublic);
  console.log('[copy-dist] Successfully copied frontend build to backend public folders.');
} catch (err) {
  console.warn('[copy-dist] Note during copying:', err.message);
}
