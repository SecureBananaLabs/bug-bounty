import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

interface RateLimiterOptions {
  points: number; // Number of points
  duration: number; // Per second(s)
}

// Create rate limiter instances
const generalRateLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});

const strictRateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 60, // per 60 seconds
});

const rateLimiters = {
  general: generalRateLimiter,
  strict: strictRateLimiter
};

const rateLimiterMiddleware = (type: keyof typeof rateLimiters = 'general') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || '';
    const limiter = rateLimiters[type];
    
    try {
      // Consume point for this request - this happens BEFORE body parsing
      await limiter.consume(ip);
      next();
    } catch (rateLimiterRes) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }
  };
};

// Export middleware that runs before body parsing
export const rateLimiter = rateLimiterMiddleware('general');
export const strictRateLimiter = rateLimiterMiddleware('strict');