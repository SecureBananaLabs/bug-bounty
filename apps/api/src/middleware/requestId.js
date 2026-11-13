import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";

export function requestId(req, res, next) {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const id = typeof incoming === "string" && incoming.trim() !== ""
    ? incoming.trim()
    : randomUUID();

  req.id = id;
  res.setHeader(REQUEST_ID_HEADER, id);

  return next();
}
