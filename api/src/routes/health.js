import { Router } from 'express';
import { readDb } from '../db/index.js';
import { ok } from '../utils/respond.js';
import { mongoEnabled, mongoHealth } from '../db/mongoStore.js';

const router = Router();

router.get('/', (_req, res) => {
  ok(res, { service: 'parfumerya-api', health: '/api/health', version: 2 });
});

router.get('/api/health', (_req, res) => {
  let dbOk = false;
  try {
    readDb();
    dbOk = true;
  } catch {
    dbOk = false;
  }
  ok(res, {
    ok: dbOk,
    version: 2,
    uptimeSec: Math.round(process.uptime()),
    storage: mongoEnabled() ? { driver: 'mongodb', ...mongoHealth() } : { driver: 'file' },
    features: ['hero-manage', 'hero-video', 'hero-upload', 'file-upload', 'settings', 'coupons-crud', 'categories-crud', 'profile', 'users-manage', 'register-otp', 'mongodb'],
  });
});

export default router;
