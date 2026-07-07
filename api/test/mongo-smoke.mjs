// MongoDB inteqrasiyası üçün end-to-end smoke test.
// İşlətmək: npm run test:mongo
// Yaddaşda müvəqqəti MongoDB qaldırır, serveri ona qoşur, məlumatın
// migrasiyasını, yazılmasını və restart-dan sonra qalmasını yoxlayır.

import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_DIR = path.join(__dirname, '..');
const PORT = 5098;
const BASE = `http://127.0.0.1:${PORT}/api`;

let failures = 0;
function check(name, cond, extra = '') {
  if (cond) {
    console.log(`  ✔ ${name}`);
  } else {
    failures += 1;
    console.error(`  ✘ ${name} ${extra}`);
  }
}

function startServer(uri) {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: API_DIR,
    env: { ...process.env, MONGODB_URI: uri, PORT: String(PORT), NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => process.stdout.write(`    [server] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`    [server] ${d}`));
  return child;
}

async function waitForHealth(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return (await res.json()).data;
    } catch {
      // server hələ qalxır
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('Server health timeout');
}

async function api(path, options) {
  const res = await fetch(`${BASE}${path}`, options);
  return res.json();
}

const localDb = JSON.parse(fs.readFileSync(path.join(API_DIR, 'data', 'db.json'), 'utf8'));
const admin = localDb.users.find((u) => u.roles?.includes('Admin'));

console.log('▶ Yaddaşda MongoDB qaldırılır...');
const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();
console.log(`  Mongo URI: ${uri}`);

let server = null;
try {
  console.log('▶ 1-ci mərhələ: server Mongo ilə başladılır (db.json migrasiyası)');
  server = startServer(uri);
  const health = await waitForHealth();

  check('health.storage.driver = mongodb', health.storage?.driver === 'mongodb', JSON.stringify(health.storage));
  check('health.storage.connected', health.storage?.connected === true);

  const products = await api('/products');
  const productCount = Array.isArray(products.data) ? products.data.length : products.data?.items?.length;
  check(
    `db.json-dakı ${localDb.products.length} məhsul Mongo-ya köçürülüb`,
    productCount === localDb.products.length,
    `(gələn: ${productCount})`
  );

  const login = await api('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: admin.email, password: admin.password }),
  });
  check('admin login işləyir', login.success === true, JSON.stringify(login));
  const token = login.data?.accessToken;

  const testName = `Mongo Smoke ${Date.now()}`;
  const created = await api('/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: testName }),
  });
  check('yeni kateqoriya yaradıldı', created.success === true, JSON.stringify(created));

  // persist növbəsinin işləməsi üçün qısa fasilə
  await new Promise((r) => setTimeout(r, 1500));

  console.log('▶ Server dayandırılır (restart simulyasiyası)...');
  server.kill('SIGKILL');
  server = null;
  await new Promise((r) => setTimeout(r, 800));

  console.log('▶ 2-ci mərhələ: server eyni Mongo ilə yenidən başladılır');
  server = startServer(uri);
  await waitForHealth();

  const cats = await api('/categories');
  const found = (cats.data ?? []).some((c) => c.name === testName);
  check('restart-dan sonra kateqoriya Mongo-da qalıb', found, JSON.stringify(cats.data?.map((c) => c.name)));

  const products2 = await api('/products');
  const productCount2 = Array.isArray(products2.data) ? products2.data.length : products2.data?.items?.length;
  check('restart-dan sonra məhsullar yerindədir', productCount2 === localDb.products.length, `(gələn: ${productCount2})`);

  const login2 = await api('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: admin.email, password: admin.password }),
  });
  check('restart-dan sonra admin login işləyir', login2.success === true);
} finally {
  if (server) server.kill('SIGKILL');
  await mongod.stop();
}

if (failures) {
  console.error(`\n✘ ${failures} yoxlama uğursuz oldu`);
  process.exit(1);
}
console.log('\n✔ Bütün Mongo smoke testləri keçdi');
