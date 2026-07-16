export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function fail(res, message, status = 400, errors) {
  const payload = { success: false, message };

  if (Array.isArray(errors)) {
    payload.errors = errors;
  }

  return res.status(status).json(payload);
}
