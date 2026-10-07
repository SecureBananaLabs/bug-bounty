import { RateLimiterRedis } from 'rate-limiter-flexible';

const generalApiLimiter = new RateLimiterRedis({
  storeClient: process.env.REDIS_URL ? new (require('ioredis'))(process.env.REDIS_URL) : undefined,
  points: 200,
  duration: 900, // 15 minutes
  keyPrefix: 'api:general',
});

const loginLimiter = new RateLimiterRedis({
  storeClient: process.env.REDIS_URL ? new (require('ioredis'))(process.env.ioredis)(process.env.REDIS_URL) : undefined,
  points: 5,
  duration: 900, // 15 minutes
  keyPrefix: 'api:login',
});

export { generalApiLimiter, loginLimiter };
