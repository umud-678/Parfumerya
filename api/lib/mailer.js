import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST?.trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER?.trim();
const SMTP_PASS = process.env.SMTP_PASS?.trim();
const SMTP_FROM = process.env.SMTP_FROM?.trim() || SMTP_USER || 'noreply@parfumerya.az';

let transporter = null;

function smtpConfigured() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function getTransporter() {
  if (!smtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
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

  const transport = getTransporter();
  if (!transport) {
    console.log('\n📧 [DEV OTP] SMTP konfiqurasiya olunmayıb — OTP konsola yazılır');
    console.log(`   Alıcı: ${to}`);
    console.log(`   Kod: ${code}\n`);
    return { sent: false, devLogged: true };
  }

  await transport.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });

  return { sent: true, devLogged: false };
}

export { smtpConfigured };
