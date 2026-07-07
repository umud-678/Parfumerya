import crypto from 'crypto';
import { MongoClient } from 'mongodb';

// MongoDB-yə əsaslanan yaddaş qatı.
// Bütün db obyekti yaddaşda saxlanılır, hər writeDb-də dəyişən açarlar
// (users, products, orders, ...) ayrı-ayrı kolleksiyalara yazılır.
// MONGODB_URI təyin edilməyibsə bu modul heç istifadə olunmur (fayl rejimi).

let client = null;
let dbo = null;
let state = null;

// Hər açarın Mongo-ya son yazılmış JSON snapshot-u — diff üçün
const snapshots = new Map();

let dirty = false;
let chain = Promise.resolve();
let retryTimer = null;
let lastPersistError = null;

const RETRY_DELAY_MS = 15000;
const SINGLETON_ID = 'singleton';

export function mongoUri() {
  return (process.env.MONGODB_URI || process.env.MONGO_URL || '').trim();
}

export function mongoEnabled() {
  return mongoUri().length > 0;
}

function resolveDbName(uri) {
  const fromEnv = process.env.MONGODB_DB?.trim();
  if (fromEnv) return fromEnv;
  try {
    const parsed = new URL(uri);
    const name = decodeURIComponent(parsed.pathname.replace(/^\//, '')).trim();
    if (name) return name;
  } catch {
    // URI URL kimi parse olunmadısa default ada düşürük
  }
  return 'parfumerya';
}

export async function connectMongo() {
  const uri = mongoUri();
  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    retryWrites: true,
  });
  await client.connect();
  dbo = client.db(resolveDbName(uri));
  await dbo.command({ ping: 1 });
  return dbo.databaseName;
}

// Mongo-dakı bütün kolleksiyaları oxuyub db obyektini yığır.
// Heç bir kolleksiya yoxdursa null qaytarır (ilk işə salınma → seed lazımdır).
export async function loadStateFromMongo() {
  const names = (await dbo.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'));
  if (!names.length) return null;

  const loaded = {};
  for (const name of names) {
    const docs = await dbo.collection(name).find({}).sort({ _ord: 1 }).toArray();
    if (docs.length === 1 && docs[0]._id === SINGLETON_ID) {
      const { _id, _ord, ...rest } = docs[0];
      loaded[name] = rest;
    } else {
      loaded[name] = docs.map(({ _id, _ord, ...rest }) => rest);
    }
  }
  return loaded;
}

export function getState() {
  return state;
}

export function setState(nextState) {
  state = nextState;
}

// Yüklənmiş vəziyyəti snapshot kimi qeyd edir ki, ilk writeDb yalnız real dəyişiklikləri yazsın
export function primeSnapshots(loaded) {
  snapshots.clear();
  for (const [key, value] of Object.entries(loaded)) {
    snapshots.set(key, JSON.stringify(value));
  }
}

async function persistKey(key, value) {
  const coll = dbo.collection(key);

  if (!Array.isArray(value)) {
    await coll.replaceOne({ _id: SINGLETON_ID }, { ...value }, { upsert: true });
    return;
  }

  const ids = [];
  const ops = value.map((item, index) => {
    if (!item.id) item.id = crypto.randomUUID();
    const id = String(item.id);
    ids.push(id);
    return {
      replaceOne: {
        filter: { _id: id },
        replacement: { ...item, _ord: index },
        upsert: true,
      },
    };
  });

  if (ops.length) await coll.bulkWrite(ops, { ordered: false });
  await coll.deleteMany(ids.length ? { _id: { $nin: ids } } : {});
}

async function persistAllChanged(current) {
  const keys = new Set([...Object.keys(current), ...snapshots.keys()]);
  for (const key of keys) {
    const value = current[key];
    if (value === undefined || value === null) {
      await dbo.collection(key).deleteMany({});
      snapshots.delete(key);
      continue;
    }
    const json = JSON.stringify(value);
    if (snapshots.get(key) === json) continue;
    await persistKey(key, value);
    // persistKey id əlavə edə bilər — snapshot-u yekun vəziyyətdən götürürük
    snapshots.set(key, JSON.stringify(value));
  }
}

// İlk seed/miqrasiya üçün: uğursuz olsa exception atır (boot dayansın)
export async function persistNow(nextState) {
  state = nextState;
  await persistAllChanged(state);
}

function scheduleRetry() {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (dirty) queueFlush();
  }, RETRY_DELAY_MS);
  retryTimer.unref?.();
}

async function flushDirty() {
  if (!dirty || !dbo) return;
  dirty = false;
  try {
    await persistAllChanged(state);
    lastPersistError = null;
  } catch (err) {
    dirty = true;
    lastPersistError = err;
    console.error(`[mongo] yazma xətası — ${RETRY_DELAY_MS / 1000}s sonra yenidən cəhd olunacaq:`, err.message);
    scheduleRetry();
  }
}

function queueFlush() {
  chain = chain.then(flushDirty).catch(() => {});
  return chain;
}

// writeDb-nin Mongo variantı: vəziyyəti yeniləyir və yazmanı növbəyə qoyur
export function persistState(nextState) {
  state = nextState;
  dirty = true;
  return queueFlush();
}

export function mongoHealth() {
  return {
    connected: !!dbo,
    pendingWrites: dirty,
    lastWriteError: lastPersistError?.message ?? null,
  };
}

// Shutdown zamanı gözləyən yazıları tamamlayıb bağlantını bağlayır
export async function closeMongo() {
  try {
    await queueFlush();
  } catch {
    // gözləyən yazı alınmadısa da bağlanmaya davam edirik
  }
  try {
    await client?.close();
  } catch {
    // bağlanma xətası kritik deyil
  }
  client = null;
  dbo = null;
}
