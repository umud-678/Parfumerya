import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'dist');
const storefrontDist = path.join(root, 'storefront', 'dist');
const adminDist = path.join(root, 'admin', 'dist');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

for (const dir of [storefrontDist, adminDist]) {
  if (!fs.existsSync(dir)) {
    console.error(`[build] tapılmadı: ${dir}`);
    process.exit(1);
  }
}

if (fs.existsSync(out)) fs.rmSync(out, { recursive: true });
copyDir(storefrontDist, out);
copyDir(adminDist, path.join(out, 'admin'));
console.log('[build] storefront + admin → frontend/dist');
