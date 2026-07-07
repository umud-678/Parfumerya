import { Router } from 'express';
import { readDb, writeDb } from '../db/index.js';
import { defaultDb } from '../db/defaults.js';
import { ok } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/api/settings', (_req, res) => {
  const db = readDb();
  ok(res, db.settings ?? defaultDb().settings);
});

router.put('/api/settings', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  db.settings = { ...(db.settings ?? defaultDb().settings), ...req.body };
  writeDb(db);
  ok(res, db.settings, 'Ayarlar yeniləndi');
});

export default router;
