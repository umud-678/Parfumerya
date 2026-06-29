import crypto from 'crypto';
import { sendOtpEmail, smtpConfigured } from './mailer.js';
import { normalizeEmail, validateRegistrationInput } from './authValidation.js';

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

export function cleanupExpiredOtps(db) {
  const now = Date.now();
  const before = db.registrationOtps?.length ?? 0;
  db.registrationOtps = (db.registrationOtps ?? []).filter(
    (entry) => new Date(entry.expiresAt).getTime() > now
  );
  return before !== db.registrationOtps.length;
}

function findPending(db, email) {
  return (db.registrationOtps ?? []).find((e) => e.email === email) ?? null;
}

function removePending(db, email) {
  db.registrationOtps = (db.registrationOtps ?? []).filter((e) => e.email !== email);
}

export async function requestRegistrationOtp(db, body, siteName) {
  cleanupExpiredOtps(db);

  const validated = validateRegistrationInput(body);
  if (!validated.ok) {
    return { ok: false, status: 400, message: validated.message };
  }

  const { fullName, firstName, lastName, email, password } = validated.value;

  if (db.users.some((u) => normalizeEmail(u.email) === email)) {
    return { ok: false, status: 400, message: 'Bu e-poçt artıq qeydiyyatdan keçib' };
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
    firstName,
    lastName,
    fullName,
    password,
    otpHash: hashOtp(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    attempts: 0,
    resendCount: existing ? resendCount + 1 : 0,
    createdAt: existing?.createdAt ?? nowIso(),
    lastSentAt: nowIso(),
  };

  removePending(db, email);
  if (!db.registrationOtps) db.registrationOtps = [];
  db.registrationOtps.push(entry);

  await sendOtpEmail({ to: email, fullName, code, siteName });

  const devMode = process.env.NODE_ENV !== 'production' && !smtpConfigured();

  return {
    ok: true,
    email,
    expiresInSec: OTP_TTL_MS / 1000,
    message: 'Təsdiq kodu e-poçtunuza göndərildi',
    ...(devMode ? { devOtp: code } : {}),
  };
}

export function verifyRegistrationOtp(db, body) {
  cleanupExpiredOtps(db);

  const email = normalizeEmail(body?.email);
  const code = String(body?.otp ?? body?.code ?? '').trim();

  if (!email) {
    return { ok: false, status: 400, message: 'E-poçt vacibdir' };
  }
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, status: 400, message: '6 rəqəmli OTP kodu daxil edin' };
  }

  if (db.users.some((u) => normalizeEmail(u.email) === email)) {
    return { ok: false, status: 400, message: 'Bu e-poçt artıq qeydiyyatdan keçib' };
  }

  const pending = findPending(db, email);
  if (!pending) {
    return { ok: false, status: 400, message: 'OTP kodu tapılmadı və ya vaxtı bitib. Yenidən qeydiyyatdan keçin' };
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

  const user = {
    id: crypto.randomUUID(),
    email: pending.email,
    password: pending.password,
    firstName: pending.firstName ?? pending.fullName?.split(/\s+/)[0] ?? '',
    lastName: pending.lastName ?? pending.fullName?.split(/\s+/).slice(1).join(' ') ?? '',
    fullName: pending.fullName,
    phone: '',
    roles: ['Customer'],
    isBlocked: false,
    emailVerified: true,
    createdAt: nowIso(),
    token: crypto.randomUUID(),
  };

  db.users.push(user);
  removePending(db, email);

  db.notifications.unshift({
    id: crypto.randomUUID(),
    type: 'NewUser',
    title: 'Yeni istifadəçi',
    message: `${user.email} qeydiyyatdan keçdi (OTP təsdiqləndi)`,
    isRead: false,
    createdAt: nowIso(),
  });

  return {
    ok: true,
    user,
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
