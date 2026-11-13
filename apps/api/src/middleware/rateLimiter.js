import { performance } from 'node:perf_hooks';

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default
  const max = options.max || 100; // 100 requests per window
  const message = options.message || { error: 'Too many requests, please try again later.' };
  const statusCode = options.statusCode || 429;
  const store = new Map();

  const cleanup = () => {
    const now = performance.now();
    for (const [key, timestamps] of store.entries()) {
      const valid = timestamps.filter(t => now - t < windowMs);
      if (valid.length === 0) {
        store.delete(key);
      } else {
        store.set(key, valid);
      }
    }
  };

  const timer = setInterval(cleanup, windowMs);
  if (timer.unref) {
    timer.unref();
  }

  const middleware = (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = performance.now();
    let timestamps = store.get(ip) || [];
    timestamps = timestamps.filter(t => now - t < windowMs);

    if (timestamps.length >= max) {
      const oldest = timestamps[0];
      const resetTime = Math.ceil((oldest + windowMs - now) / 1000);
      res.setHeader('Retry-After', resetTime > 0 ? resetTime : 1);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + oldest + windowMs - now) / 1000));
      return res.status(statusCode).json(typeof message === 'function' ? message(req, res) : message);
    }

    timestamps.push(now);
    store.set(ip, timestamps);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - timestamps.length));
    res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + timestamps[0] + windowMs - now) / 1000));

    if (next) {
      next();
    }
  };

  middleware.reset = () => {
    store.clear();
  };

  middleware.stop = () => {
    clearInterval(timer);
  };

  return middleware;
};

export default rateLimiter;
