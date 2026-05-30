const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:4000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4000"
];

export function csrfProtection(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }
  const origin = req.headers["origin"];
  const referer = req.headers["referer"];
  if (!origin && !referer) {
    return res.status(403).json({
      success: false,
      message: "CSRF check failed: request must include Origin or Referer header"
    });
  }
  const source = origin || referer;
  const allowed = ALLOWED_ORIGINS.some((allowed) => source.startsWith(allowed));
  if (!allowed) {
    return res.status(403).json({
      success: false,
      message: "CSRF check failed: disallowed origin"
    });
  }
  next();
}
