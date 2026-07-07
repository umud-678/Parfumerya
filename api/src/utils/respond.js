export function ok(res, data, message) {
  return res.json({ success: true, data, message });
}

export function fail(res, status, message, extra) {
  return res.status(status).json({ success: false, message, ...(extra ?? {}) });
}
