// Giriş nöqtəsi — bütün kod src/ qovluğundadır:
//   src/config.js     → port və yollar
//   src/app.js        → express app (cors, middleware, route-lar)
//   src/db/           → readDb/writeDb, MongoDB store, default seed
//   src/routes/       → hər modul öz faylında
//   src/middleware/   → auth, upload, error handler
//   src/helpers/      → biznes məntiqi köməkçiləri
//   src/lib/          → mailer, OTP, validasiya

import './src/loadEnv.js';
import app from './src/app.js';
import { PORT } from './src/config.js';
import { bootRuntime, initStorage } from './src/db/index.js';
import { mongoEnabled, closeMongo } from './src/db/mongoStore.js';
import { smtpConfigured, verifySmtpConnection } from './src/lib/mailer.js';

async function start() {
  bootRuntime();

  try {
    await initStorage();
  } catch (err) {
    console.error('[boot] storage init failed:', err.message);
    if (mongoEnabled()) {
      console.error('[boot] MONGODB_URI düzgünlüyünü yoxlayın (istifadəçi adı/şifrə, cluster ünvanı).');
      console.error('[boot] MongoDB Atlas-da Network Access → IP Access List-ə 0.0.0.0/0 əlavə olunduğundan əmin olun.');
    }
    process.exit(1);
  }

  if (smtpConfigured()) {
    const smtp = await verifySmtpConnection();
    if (smtp.ok) {
      console.log(`[boot] SMTP OK (göndərən: ${smtp.from})`);
    } else {
      console.warn(`[boot] SMTP xəbərdarlığı: ${smtp.reason}`);
      console.warn('[boot] OTP kodları e-poçta getməyə bilər — SMTP_USER + Gmail App Password yoxlayın');
    }
  } else {
    console.warn('[boot] SMTP təyin edilməyib — OTP kodları yalnız dev rejimində konsola yazılır');
  }

  if (mongoEnabled()) {
    // Render restart/deploy zamanı gözləyən yazıları itirməmək üçün
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.on(signal, async () => {
        console.log(`[shutdown] ${signal} — gözləyən Mongo yazıları tamamlanır`);
        await closeMongo();
        process.exit(0);
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Parfumerya API → port ${PORT}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nPort ${PORT} artıq məşğuldur (köhnə API prosesi işləyir).`);
      console.error('Həll: frontend qovluğunda `npm run stop` işlədin, sonra yenidən `npm run dev`.\n');
      process.exit(1);
    }
    throw err;
  });
}

start();
