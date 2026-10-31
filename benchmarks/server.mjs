import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const rateLimit = require('express-rate-limit');
process.env.JWT_SECRET = randomBytes(32).toString('hex');
const { createApp } = await import('../apps/api/src/app.js');
const { signAccessToken } = await import('../apps/api/src/utils/jwt.js');
const { connectDb } = await import('../apps/api/src/config/db.js');
await connectDb();
const app = createApp({ rateLimiter: rateLimit({ windowMs: 900000, limit: 1000000, standardHeaders: 'draft-7', legacyHeaders: false }) });
const server = app.listen(0, '127.0.0.1', () => {
  process.send({ port: server.address().port, token: signAccessToken({ sub: 'benchmark-admin', role: 'admin' }) });
});
process.on('disconnect', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
