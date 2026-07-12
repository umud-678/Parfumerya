import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST?.trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER?.trim();
const SMTP_PASS = process.env.SMTP_PASS?.trim();
const SMTP_FROM = process.env.SMTP_FROM?.trim();

let transporter = null;

function logSmtpError(err, context) {
  console.error(`[mailer] ${context} — SMTP xətası:`);
  console.error('  message:', err?.message);
  if (err?.code) console.error('  code:', err.code);
  if (err?.command) console.error('  command:', err.command);
  if (err?.response) console.error('  response:', err.response);
  if (err?.responseCode) console.error('  responseCode:', err.responseCode);
  if (err?.stack) console.error(err.stack);
  console.error('  full error:', err);
}

function createSmtpTransport() {
  const useSsl = SMTP_PORT === 465;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: useSsl, // 587 → false (STARTTLS), 465 → true (SSL)
    requireTLS: !useSsl,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: {
      minVersion: 'TLSv1.2',
    },
  });
}

export function smtpConfigured() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

/** Gmail SMTP ilə göndərən ünvan hesabla eyni olmalıdır */
function resolveFromAddress(siteName = 'Amoria') {
  if (!SMTP_USER) return SMTP_FROM || 'noreply@parfumerya.az';

  let displayName = siteName;
  if (SMTP_FROM) {
    const match = SMTP_FROM.match(/^(.+?)\s*<[^>]+>$/);
    if (match?.[1]) {
      displayName = match[1].trim().replace(/^["']|["']$/g, '');
    } else if (!SMTP_FROM.includes('@')) {
      displayName = SMTP_FROM;
    }
  }

  return `${displayName} <${SMTP_USER}>`;
}

function getTransporter() {
  if (!smtpConfigured()) return null;
  if (!transporter) {
    transporter = createSmtpTransport();
    console.log(`[mailer] SMTP transporter hazır (host=${SMTP_HOST}, port=${SMTP_PORT}, secure=${SMTP_PORT === 465})`);
  }
  return transporter;
}

export async function verifySmtpConnection() {
  if (!smtpConfigured()) {
    return { ok: false, reason: 'SMTP_HOST / SMTP_USER / SMTP_PASS təyin edilməyib' };
  }
  try {
    await getTransporter().verify();
    return { ok: true, from: resolveFromAddress() };
  } catch (err) {
    logSmtpError(err, 'SMTP verify uğursuz');
    return { ok: false, reason: err.message };
  }
}

async function deliverMail({ to, subject, text, html, siteName, logTag }) {
  const transport = getTransporter();
  if (!transport) {
    const codeMatch = text.match(/\n(\d{6})\n/);
    const code = codeMatch?.[1] ?? '------';
    console.log(`\n📧 [DEV ${logTag}] SMTP konfiqurasiya olunmayıb — OTP konsola yazılır`);
    console.log(`   Alıcı: ${to}`);
    console.log(`   Kod: ${code}\n`);
    return { sent: false, devLogged: true };
  }

  const from = resolveFromAddress(siteName);
  try {
    const info = await transport.sendMail({ from, to, subject, text, html });
    console.log(`[mailer] ${logTag} göndərildi → ${to} (messageId=${info.messageId ?? 'n/a'})`);
    return { sent: true, devLogged: false };
  } catch (err) {
    logSmtpError(err, `${logTag} uğursuz → ${to}`);
    // Bağlantı xətası ola bilər — növbəti cəhd üçün transporter sıfırlanır
    transporter = null;
    const hint =
      err.message?.includes('Invalid login') || err.message?.includes('535')
        ? 'Gmail App Password səhvdir və ya 2FA aktiv deyil'
        : err.message?.includes('Mail command failed')
          ? 'Göndərən ünvan Gmail hesabı ilə uyğun deyil'
          : 'SMTP server cavab vermədi';
    throw new Error(`E-poçt göndərilmədi: ${hint}`);
  }
}

export async function sendOtpEmail({ to, fullName, code, siteName = 'Amoria' }) {
  const subject = `${siteName} — Qeydiyyat təsdiq kodu`;
  const text = `Salam ${fullName},

${siteName} saytında qeydiyyatınızı tamamlamaq üçün təsdiq kodunuz:

${code}

Kod 10 dəqiqə ərzində etibarlıdır. Bu kodu heç kimlə paylaşmayın.

Əgər siz qeydiyyatdan keçməmisinizsə, bu e-poçtu nəzərə almayın.`;

  const html = `
    <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="color:#2d6a4f;margin:0 0 16px">${siteName}</h2>
      <p>Salam <strong>${fullName}</strong>,</p>
      <p>Qeydiyyatınızı tamamlamaq üçün aşağıdakı təsdiq kodunu daxil edin:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#2d6a4f;margin:24px 0">${code}</p>
      <p style="color:#666;font-size:14px">Kod 10 dəqiqə ərzində etibarlıdır.</p>
    </div>`;

  return deliverMail({ to, subject, text, html, siteName, logTag: 'register-otp' });
}

export async function sendPasswordResetEmail({ to, fullName, code, siteName = 'Amoria' }) {
  const subject = `${siteName} — Şifrə bərpası kodu`;
  const text = `Salam ${fullName},

${siteName} saytında şifrənizi yeniləmək üçün təsdiq kodunuz:

${code}

Kod 10 dəqiqə ərzində etibarlıdır. Bu kodu heç kimlə paylaşmayın.

Əgər siz bu sorğunu göndərməmisinizsə, bu e-poçtu nəzərə almayın.`;

  const html = `
    <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="color:#2d6a4f;margin:0 0 16px">${siteName}</h2>
      <p>Salam <strong>${fullName}</strong>,</p>
      <p>Şifrənizi yeniləmək üçün aşağıdakı təsdiq kodunu daxil edin:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#2d6a4f;margin:24px 0">${code}</p>
      <p style="color:#666;font-size:14px">Kod 10 dəqiqə ərzində etibarlıdır.</p>
    </div>`;

  return deliverMail({ to, subject, text, html, siteName, logTag: 'password-reset' });
}
