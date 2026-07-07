import { readDb } from '../db/index.js';
import { fail } from '../utils/respond.js';
import { isAdminUser } from '../helpers/users.js';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = header.slice(7);
  const db = readDb();
  req.user = db.users.find((u) => u.token === token) ?? null;
  if (req.user?.isBlocked) {
    return fail(res, 403, 'Hesabınız bloklanıb');
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return fail(res, 401, 'Giriş tələb olunur');
  next();
}

export function requireAdmin(req, res, next) {
  if (!isAdminUser(req.user)) {
    return fail(res, 403, 'Admin icazəsi tələb olunur');
  }
  next();
}
