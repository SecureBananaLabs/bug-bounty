export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function fail(res, message, status = 400, errors = undefined) {
  const body = { success: false, message };
  if (errors !== undefined) {
    body.errors = errors;
  }
  return res.status(status).json(body);
}
