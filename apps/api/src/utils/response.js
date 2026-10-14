export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function fail(res, message, status = 400, errors = null) {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(status).json(response);
}

export function notFound(res, message = "Resource not found") {
  return fail(res, message, 404);
}
