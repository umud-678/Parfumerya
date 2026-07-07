import { fail } from '../utils/respond.js';

export function errorHandler(err, _req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }
  console.error('[error]', err);
  fail(res, err.status ?? 500, err.message ?? 'Server xətası');
}
