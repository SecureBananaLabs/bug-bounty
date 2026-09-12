export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function fail(res, message, status = 400, issues) {
  const payload = { success: false, message };
  if (issues) {
    payload.issues = issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message
    }));
  }

  return res.status(status).json(payload);
}
