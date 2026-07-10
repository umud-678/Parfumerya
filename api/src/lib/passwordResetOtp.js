import crypto from 'crypto';
import { sendPasswordResetEmail, smtpConfigured } from './mailer.js';
import { normalizeEmail, validateEmail, validatePassword } from './authValidation.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_RESENDS = 3;
const OTP_SECRET = process.env.OTP_SECRET || 'parfumerya-dev-otp-secret';

function hashOtp(code) {
  return crypto.createHash('sha256').update(`${code}:${OTP_SECRET}`).digest('hex');
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999));
}

function nowIso() {
  return new Date().toISOString();
}

export function cleanupExpiredPasswordResetOtps(db) {
  const now = Date.now();
  const before = db.passwordResetOtps?.length ?? 0;
  db.passwordResetOtps = (db.passwordResetOtps ?? []).filter(
    (entry) => new Date(entry.expiresAt).getTime() > now
  );
  return before !== db.passwordResetOtps.length;
}

function findPending(db, email) {
  return (db.passwordResetOtps ?? []).find((e) => e.email === email) ?? null;
}

function removePending(db, email) {
  db.passwordResetOtps = (db.passwordResetOtps ?? []).filter((e) => e.email !== email);
}

function findCustomerUser(db, email) {
  return db.users.find((u) => normalizeEmail(u.email) === email) ?? null;
}

export async function requestPasswordResetOtp(db, body, siteName) {
  cleanupExpiredPasswordResetOtps(db);

  const emailResult = validateEmail(body?.email);
  if (!emailResult.ok) {
    return { ok: false, status: 400, message: emailResult.message };
  }

  const email = emailResult.value;
  const user = findCustomerUser(db, email);
  if (!user) {
    return { ok: false, status: 404, message: 'Bu e-poçt ilə qeydiyyat tapılmadı' };
  }
  if (user.isBlocked) {
    return { ok: false, status: 403, message: 'Hesabınız bloklanıb. Admin ilə əlaqə saxlayın.' };
  }

  const existing = findPending(db, email);
  if (existing?.lastSentAt) {
    const elapsed = Date.now() - new Date(existing.lastSentAt).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return {
        ok: false,
        status: 429,
        message: `Yeni kod göndərmək üçün ${waitSec} saniyə gözləyin`,
        retryAfterSec: waitSec,
      };
    }
  }

  const resendCount = existing?.resendCount ?? 0;
  if (resendCount >= MAX_RESENDS) {
    return {
      ok: false,
      status: 429,
      message: 'Çox sayda kod sorğusu. Bir az sonra yenidən cəhd edin',
    };
  }

  const code = generateOtpCode();
  const entry = {
    id: crypto.randomUUID(),
    email,
    userId: user.id,
    otpHash: hashOtp(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    attempts: 0,
    resendCount: existing ? resendCount + 1 : 0,
    createdAt: existing?.createdAt ?? nowIso(),
    lastSentAt: nowIso(),
  };

  removePending(db, email);
  if (!db.passwordResetOtps) db.passwordResetOtps = [];
  db.passwordResetOtps.push(entry);

  try {
    await sendPasswordResetEmail({
      to: email,
      fullName: user.fullName || user.email,
      code,
      siteName,
    });
  } catch (err) {
    removePending(db, email);
    return { ok: false, status: 503, message: err.message || 'E-poçt göndərilmədi' };
  }

  const devMode = process.env.NODE_ENV !== 'production' && !smtpConfigured();

  return {
    ok: true,
    email,
    expiresInSec: OTP_TTL_MS / 1000,
    message: 'Şifrə bərpası kodu e-poçtunuza göndərildi',
    ...(devMode ? { devOtp: code } : {}),
  };
}

export function resetPasswordWithOtp(db, body) {
  cleanupExpiredPasswordResetOtps(db);

  const emailResult = validateEmail(body?.email);
  if (!emailResult.ok) {
    return { ok: false, status: 400, message: emailResult.message };
  }

  const email = emailResult.value;
  const code = String(body?.otp ?? body?.code ?? '').trim();
  const passwordResult = validatePassword(body?.password);

  if (!/^\d{6}$/.test(code)) {
    return { ok: false, status: 400, message: '6 rəqəmli OTP kodu daxil edin' };
  }
  if (!passwordResult.ok) {
    return { ok: false, status: 400, message: passwordResult.message };
  }

  const user = findCustomerUser(db, email);
  if (!user) {
    return { ok: false, status: 404, message: 'İstifadəçi tapılmadı' };
  }
  if (user.isBlocked) {
    return { ok: false, status: 403, message: 'Hesabınız bloklanıb. Admin ilə əlaqə saxlayın.' };
  }

  const pending = findPending(db, email);
  if (!pending) {
    return { ok: false, status: 400, message: 'OTP kodu tapılmadı və ya vaxtı bitib. Yeni kod alın' };
  }

  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    removePending(db, email);
    return { ok: false, status: 400, message: 'OTP kodunun vaxtı bitib. Yeni kod alın' };
  }

  if (pending.attempts >= MAX_VERIFY_ATTEMPTS) {
    removePending(db, email);
    return { ok: false, status: 429, message: 'Çox sayda səhv cəhd. Yeni kod alın' };
  }

  if (hashOtp(code) !== pending.otpHash) {
    pending.attempts += 1;
    const left = MAX_VERIFY_ATTEMPTS - pending.attempts;
    return {
      ok: false,
      status: 400,
      message: left > 0 ? `OTP kodu səhvdir. ${left} cəhd qaldı` : 'OTP kodu səhvdir',
    };
  }

  user.password = passwordResult.value;
  user.token = crypto.randomUUID();
  removePending(db, email);

  return {
    ok: true,
    message: 'Şifrə uğurla yeniləndi',
    auth: {
      accessToken: user.token,
      refreshToken: crypto.randomUUID(),
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone ?? '',
      roles: user.roles,
    },
  };
}
