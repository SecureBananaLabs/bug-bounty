import crypto from "node:crypto";

export function requestIdMiddleware(req, res, next) {
  const reqId = req.headers["x-request-id"] || crypto.randomUUID();
  req.id = reqId;
  res.setHeader("X-Request-Id", reqId);
  next();
}
