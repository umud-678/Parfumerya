// api/.env faylını process.env-ə yükləyir (dotenv paketi olmadan).
// Artıq təyin olunmuş dəyişənləri ƏZMİR — Render kimi mühitlərdə
// dashboard-dakı dəyərlər üstün qalır.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, '..', '.env');

if (fs.existsSync(ENV_PATH)) {
  const lines = fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/);
  let loaded = 0;
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
      loaded += 1;
    }
  }
  if (loaded) console.log(`[env] .env faylından ${loaded} dəyişən yükləndi`);
}
