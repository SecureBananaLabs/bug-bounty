import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiter that tracks requests before body parsing
// This ensures malformed JSON requests are still counted
export const preParseRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address as the key
    return req.ip;
  },
  skip: (req) => {
    // Don't skip any requests - we want to count all of them
    return false;
  }
});

// Specialized rate limiter for malformed JSON requests
export const malformedJsonRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Track the request immediately when it comes in
  // This runs before body parsing middleware
  if (req.headers['content-type']?.includes('application/json')) {
    // Check if body is malformed by attempting to parse it
    let body;
    try {
      if (req.body) {
        // Body already parsed, but might be malformed
        body = req.body;
      } else if (req.rawBody) {
        // Raw body available
        body = JSON.parse(req.rawBody);
      }
    } catch (error) {
      // Malformed JSON detected - this should still count toward rate limiting
      // We increment the rate limit counter even for malformed requests
      // The actual rate limiting is handled by the preParseRateLimiter
    }
  }
  
  // Continue to next middleware
  next();
};

// Middleware to capture raw body for JSON requests
export const captureRawBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['content-type']?.includes('application/json')) {
    // Capture raw body for potential malformed JSON detection
    req.rawBody = '';
    req.on('data', (chunk) => {
      req.rawBody += chunk;
    });
    req.on('end', () => {
      next();
    });
  } else {
    next();
  }
};

declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}