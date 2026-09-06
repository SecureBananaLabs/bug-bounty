'use strict';

/**
 * Central error-handling middleware.
 *
 * Normalizes errors into a consistent JSON shape. Client-input problems
 * (malformed JSON bodies and schema-validation failures) are mapped to
 * 400 responses instead of bubbling up as 500s.
 *
 * Error response shape:
 *   { error: string, details?: [{ field?: string, message: string }] }
 * details is only present for validation failures.
 */

const DEFAULT_MESSAGE = 'Internal Server Error';

function statusCodeOf(err) {
  const candidates = [err && err.status, err && err.statusCode];
  for (const code of candidates) {
    if (typeof code === 'number' && code >= 400 && code < 600) {
      return code;
    }
  }
  return null;
}

function toFieldDetails(list) {
  if (!Array.isArray(list)) return undefined;
  return list.map((item) => {
    const detail = { message: (item && item.message) || 'Invalid value' };
    if (item && Array.isArray(item.path) && item.path.length > 0) {
      detail.field = item.path.join('.');
    }
    return detail;
  });
}

function sendValidationError(res, message, details) {
  const body = { error: message || 'Validation failed' };
  if (details && details.length > 0) {
    body.details = details;
  }
  return res.status(400).json(body);
}

// Express identifies error middleware by its 4-argument signature, so next
// must remain in the parameter list even when it is not used.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Malformed JSON in the request body (thrown by express.json/body-parser).
  if (
    err.type === 'entity.parse.failed' ||
    (err instanceof SyntaxError && err.status === 400 && typeof err.body !== 'undefined')
  ) {
    return sendValidationError(res, 'Malformed JSON in request body');
  }

  // Zod schema-validation errors thrown by route validators.
  if (err.name === 'ZodError' && Array.isArray(err.issues)) {
    return sendValidationError(res, 'Validation failed', toFieldDetails(err.issues));
  }

  // Joi and other validation errors that carry per-field details.
  if ((err.isJoi === true || err.name === 'ValidationError') && Array.isArray(err.details)) {
    return sendValidationError(res, 'Validation failed', toFieldDetails(err.details));
  }

  // Custom validation errors thrown by validators/services.
  if (err.name === 'ValidationError' || err.code === 'VALIDATION_ERROR') {
    return sendValidationError(res, err.message || 'Validation failed');
  }

  // Errors that carry an explicit HTTP status (http-errors, service layer).
  const status = statusCodeOf(err);
  if (status) {
    const body = { error: err.message || (status < 500 ? 'Request failed' : DEFAULT_MESSAGE) };
    if (status < 500 && Array.isArray(err.details) && err.details.length > 0) {
      body.details = err.details;
    }
    return res.status(status).json(body);
  }

  // Anything else is an internal error; do not leak internals in production.
  console.error(err);
  const message =
    process.env.NODE_ENV === 'production' ? DEFAULT_MESSAGE : err.message || DEFAULT_MESSAGE;
  return res.status(500).json({ error: message });
}

module.exports = errorHandler;
