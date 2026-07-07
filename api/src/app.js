import express from 'express';
import cors from 'cors';
import { UPLOADS_ROOT } from './config.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

const defaultOrigins = new Set(['http://localhost:3000', 'http://localhost:3001']);
const configuredOrigins = new Set(
  process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : []
);
const productionOrigins = new Set(['https://amoria.space', 'https://www.amoria.space']);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (defaultOrigins.has(origin) || configuredOrigins.has(origin) || productionOrigins.has(origin)) return true;

  try {
    const hostname = new URL(origin).hostname;
    return hostname === 'localhost' || hostname.endsWith('.vercel.app') || hostname === 'amoria.space' || hostname === 'www.amoria.space';
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, cb) {
      if (isAllowedOrigin(origin)) {
        cb(null, true);
        return;
      }
      console.warn(`[cors] blocked origin: ${origin ?? '(none)'}`);
      cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(UPLOADS_ROOT));

app.use(authMiddleware);

app.use(routes);

app.use(errorHandler);

export default app;
