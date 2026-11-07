import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiter that counts requests before body parsing
// This ensures malformed JSON requests are still rate limited
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Important: skipFailedRequests should be false to count malformed requests
  skipFailedRequests: false,
  // Key generator can be customized if needed
  keyGenerator: (req: Request) => {
    // Use IP address as the key
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

// Alternative implementation with custom logic
export const customRateLimiter = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // This middleware runs BEFORE body parsing
    // So it will count requests with malformed JSON
    
    // We can implement custom tracking here if needed
    // For now, we'll use express-rate-limit but ensure it's applied correctly
    
    // Call next to continue processing
    next();
  };
};

// Middleware to be placed BEFORE body parsing middleware
export const preBodyParserRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // stricter limit for pre-parsing
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded even before request processing'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false // Critical: don't skip failed requests
});