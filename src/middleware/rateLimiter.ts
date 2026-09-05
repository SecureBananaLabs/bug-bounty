import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import bodyParser from 'body-parser';

// Initialize a rate limiter. For example, 100 requests per minute per IP.
const rateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

// Create a reusable instance of the JSON body parser.
const jsonBodyParser = bodyParser.json();

/**
 * Middleware to apply rate limiting before parsing the JSON body.
 * This ensures that all requests, including those with malformed JSON,
 * are counted against the rate limit, preventing potential abuse.
 */
export const rateLimiterWithBodyParse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Consume a point for the incoming request based on IP address BEFORE any body parsing.
    await rateLimiter.consume(req.ip);

    // 2. If the request is not rate-limited, proceed to parse the JSON body.
    jsonBodyParser(req, res, (err) => {
      // The error from bodyParser.json() indicates malformed JSON.
      if (err) {
        // The request has already been counted by the rate limiter.
        // Now, we return a clear error message to the client.
        return res.status(400).json({ message: 'Malformed JSON in request body.' });
      }
      // If JSON is valid, proceed to the next middleware in the chain.
      next();
    });
  } catch (rejRes) {
    // This catch block handles the rejection from rateLimiter.consume(),
    // which occurs when the rate limit has been exceeded.
    res.status(429).json({ message: 'Too Many Requests' });
  }
};
