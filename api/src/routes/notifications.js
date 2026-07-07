import { Router } from 'express';
import { readDb, writeDb } from '../db/index.js';
import { ok, fail } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ─── Müştəri bildirişləri ───────────────────────────────────────────────────
router.get('/api/my-notifications', requireAuth, (req, res) => {
  const db = readDb();
  const items = (db.customerNotifications ?? [])
    .filter((n) => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  ok(res, items);
});

router.get('/api/my-notifications/unread-count', requireAuth, (req, res) => {
  const db = readDb();
  const count = (db.customerNotifications ?? []).filter(
    (n) => n.userId === req.user.id && !n.isRead
  ).length;
  ok(res, { count });
});

router.patch('/api/my-notifications/:id/read', requireAuth, (req, res) => {
  const db = readDb();
  const n = (db.customerNotifications ?? []).find(
    (x) => x.id === req.params.id && x.userId === req.user.id
  );
  if (!n) return fail(res, 404, 'Bildiriş tapılmadı');
  n.isRead = true;
  writeDb(db);
  ok(res, n);
});

router.patch('/api/my-notifications/read-all', requireAuth, (_req, res) => {
  const db = readDb();
  for (const n of db.customerNotifications ?? []) {
    if (n.userId === _req.user.id) n.isRead = true;
  }
  writeDb(db);
  ok(res, { ok: true });
});

// ─── Admin bildirişləri ───────────────────────────────────────────────────────
router.get('/api/notifications', requireAuth, requireAdmin, (req, res) => {
  ok(res, readDb().notifications);
});

router.get('/api/notifications/unread-count', requireAuth, requireAdmin, (req, res) => {
  const count = readDb().notifications.filter((n) => !n.isRead).length;
  ok(res, { count });
});

router.patch('/api/notifications/:id/read', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const n = db.notifications.find((x) => x.id === req.params.id);
  if (n) n.isRead = true;
  writeDb(db);
  ok(res, null);
});

router.patch('/api/notifications/read-all', requireAuth, requireAdmin, (_req, res) => {
  const db = readDb();
  db.notifications.forEach((n) => { n.isRead = true; });
  writeDb(db);
  ok(res, null);
});

export default router;
