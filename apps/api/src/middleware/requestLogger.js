import { v4 as uuidv4 } from "crypto";

/**
 * Request logging middleware — logs method, path, status, duration
 * Format: [timestamp] METHOD /path STATUS ms
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  const id = uuidv4().slice(0, 8);

  // Attach request ID for traceability (also available via requestId middleware)
  req.requestId = req.headers["x-request-id"] || id;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLine = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms rid=${req.requestId}`;
    // Use console.warn for visibility in structured logs; swap to winston/pino in production
    console.log(logLine);
  });

  next();
}
