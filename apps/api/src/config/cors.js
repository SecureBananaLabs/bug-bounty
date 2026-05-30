import { env } from "./env.js";

function normalizeConfig(options = {}) {
  return {
    nodeEnv: options.nodeEnv ?? env.nodeEnv,
    corsOrigins: options.corsOrigins ?? env.corsOrigins
  };
}

function allowsAnyOrigin({ nodeEnv, corsOrigins }) {
  return corsOrigins.includes("*") || (nodeEnv !== "production" && corsOrigins.length === 0);
}

export function isCorsOriginAllowed(origin, options = {}) {
  const config = normalizeConfig(options);

  if (!origin) {
    return true;
  }

  if (allowsAnyOrigin(config)) {
    return true;
  }

  return config.corsOrigins.includes(origin);
}

export function corsOriginGuard(options = {}) {
  return function guardCorsOrigin(req, res, next) {
    if (isCorsOriginAllowed(req.headers.origin, options)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "CORS origin not allowed"
    });
  };
}

export function createCorsOptions(options = {}) {
  return {
    origin(origin, callback) {
      callback(null, isCorsOriginAllowed(origin, options));
    }
  };
}
