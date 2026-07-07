import { Router } from 'express';
import crypto from 'crypto';
import { readDb, writeDb } from '../db/index.js';
import { ok, fail } from '../utils/respond.js';
import { requestRegistrationOtp, verifyRegistrationOtp } from '../lib/registrationOtp.js';

const router = Router();

router.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const db = readDb();
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (!user) return fail(res, 401, 'Email və ya şifrə səhvdir');
  if (user.isBlocked) return fail(res, 403, 'Hesabınız bloklanıb. Admin ilə əlaqə saxlayın.');

  user.token = crypto.randomUUID();
  writeDb(db);

  ok(res, {
    accessToken: user.token,
    refreshToken: crypto.randomUUID(),
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles,
  }, 'Giriş uğurlu');
});

router.post('/api/auth/register/send-otp', async (req, res) => {
  const db = readDb();
  const siteName = db.settings?.siteName ?? 'Amoria';
  const result = await requestRegistrationOtp(db, req.body, siteName);
  if (!result.ok) {
    return fail(res, result.status ?? 400, result.message, result.retryAfterSec ? { retryAfterSec: result.retryAfterSec } : undefined);
  }
  writeDb(db);
  const { devOtp, ...data } = result;
  ok(res, data, result.message);
  if (devOtp && process.env.NODE_ENV !== 'production') {
    console.log(`[register-otp] dev kod ${req.body?.email}: ${devOtp}`);
  }
});

router.post('/api/auth/register/verify-otp', (req, res) => {
  const db = readDb();
  const result = verifyRegistrationOtp(db, req.body);
  if (!result.ok) {
    writeDb(db);
    return fail(res, result.status ?? 400, result.message);
  }
  writeDb(db);
  ok(res, result.auth, 'Qeydiyyat uğurla tamamlandı');
});

router.post('/api/auth/register/resend-otp', async (req, res) => {
  const db = readDb();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const pending = (db.registrationOtps ?? []).find((e) => e.email === email);
  if (!pending) {
    return fail(res, 400, 'Aktiv OTP sorğusu tapılmadı. Qeydiyyat formunu yenidən doldurun');
  }
  const result = await requestRegistrationOtp(
    db,
    {
      firstName: pending.firstName,
      lastName: pending.lastName,
      fullName: pending.fullName,
      email: pending.email,
      password: pending.password,
    },
    db.settings?.siteName ?? 'Amoria'
  );
  if (!result.ok) {
    return fail(res, result.status ?? 400, result.message, result.retryAfterSec ? { retryAfterSec: result.retryAfterSec } : undefined);
  }
  writeDb(db);
  ok(res, { email: result.email, expiresInSec: result.expiresInSec }, result.message);
});

router.post('/api/auth/register', (req, res) => {
  fail(res, 400, 'Qeydiyyat üçün OTP təsdiqi tələb olunur');
});

export default router;
