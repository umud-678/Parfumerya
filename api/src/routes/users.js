import { Router } from 'express';
import { readDb, writeDb } from '../db/index.js';
import { ok, fail } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { isAdminUser, sanitizeUser } from '../helpers/users.js';

const router = Router();

// ─── Users (Admin) ──────────────────────────────────────────────────────────
router.get('/api/users', requireAuth, requireAdmin, (_req, res) => {
  const db = readDb();
  const users = [...(db.users ?? [])]
    .map(sanitizeUser)
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  ok(res, users);
});

router.patch('/api/users/:id/block', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return fail(res, 404, 'İstifadəçi tapılmadı');
  if (user.id === req.user.id) return fail(res, 400, 'Öz hesabınızı blok edə bilməzsiniz');
  if (isAdminUser(user)) return fail(res, 400, 'Admin hesabı blok edilə bilməz');
  if (user.isBlocked) return ok(res, sanitizeUser(user), 'İstifadəçi artıq bloklanıb');

  user.isBlocked = true;
  user.token = null;
  user.updatedAt = new Date().toISOString();
  writeDb(db);
  ok(res, sanitizeUser(user), 'İstifadəçi bloklandı');
});

router.patch('/api/users/:id/unblock', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return fail(res, 404, 'İstifadəçi tapılmadı');
  if (!user.isBlocked) return ok(res, sanitizeUser(user), 'İstifadəçi bloklanmayıb');

  user.isBlocked = false;
  user.updatedAt = new Date().toISOString();
  writeDb(db);
  ok(res, sanitizeUser(user), 'İstifadəçi blokdan çıxarıldı');
});

router.delete('/api/users/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === req.params.id);
  if (idx < 0) return fail(res, 404, 'İstifadəçi tapılmadı');

  const user = db.users[idx];
  if (user.id === req.user.id) return fail(res, 400, 'Öz hesabınızı silə bilməzsiniz');
  if (isAdminUser(user)) return fail(res, 400, 'Admin hesabı silinə bilməz');

  db.wishlistFavorites = (db.wishlistFavorites ?? []).filter((f) => f.userId !== user.id);
  db.users.splice(idx, 1);
  writeDb(db);
  ok(res, { deleted: true, id: req.params.id }, 'İstifadəçi silindi');
});

// ─── User Profile ───────────────────────────────────────────────────────────
router.patch('/api/users/password', requireAuth, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return fail(res, 404, 'İstifadəçi tapılmadı');

  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return fail(res, 400, 'Cari və yeni şifrə vacibdir');
  }
  if (String(newPassword).length < 8) {
    return fail(res, 400, 'Yeni şifrə ən azı 8 simvol olmalıdır');
  }
  if (user.password !== currentPassword) {
    return fail(res, 400, 'Cari şifrə səhvdir');
  }
  user.password = newPassword;
  user.updatedAt = new Date().toISOString();
  writeDb(db);
  ok(res, null, 'Şifrə yeniləndi');
});

router.get('/api/users/me', requireAuth, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return fail(res, 404, 'İstifadəçi tapılmadı');
  ok(res, {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone ?? '',
    roles: user.roles,
  });
});

router.put('/api/users/profile', requireAuth, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return fail(res, 404, 'İstifadəçi tapılmadı');

  const { fullName, email, phone } = req.body ?? {};
  if (email && email !== user.email) {
    if (db.users.some((u) => u.email === email && u.id !== user.id)) {
      return fail(res, 400, 'Bu email artıq istifadə olunur');
    }
    user.email = email;
  }
  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  user.updatedAt = new Date().toISOString();
  writeDb(db);

  ok(res, {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone ?? '',
    roles: user.roles,
    accessToken: user.token,
  }, 'Profil yeniləndi');
});

export default router;
