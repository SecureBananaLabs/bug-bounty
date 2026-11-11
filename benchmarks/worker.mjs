import { createApp } from '../apps/api/src/app.js';
import { signAccessToken } from '../apps/api/src/utils/jwt.js';
import rateLimit from 'express-rate-limit';

// This launcher is only invoked by server.mjs over an IPC channel with a fresh
// environment. Production server.js never imports it or reads these settings.
if (!process.send || process.env.BENCHMARK_CHILD !== '1' || process.env.NODE_ENV !== 'test') {
  throw new Error('Use the benchmark parent process to start an isolated API');
}

function inventory(app) {
  const found = [];
  function walk(stack, prefix) {
    for (const layer of stack) {
      if (layer.route) {
        if (typeof layer.route.path !== 'string') throw new Error('Unsupported route shape; update benchmark discovery');
        const path = `${prefix}${layer.route.path}`.replace(/\/$/, '');
        if (path.startsWith('/api/')) {
          for (const [method, enabled] of Object.entries(layer.route.methods)) {
            if (enabled) found.push({ method: method.toUpperCase(), route: path });
          }
        }
      } else if (layer.handle?.stack) {
        const source = layer.regexp.source;
        const suffix = '\\/?(?=\\/|$)';
        if (!source.startsWith('^') || !source.endsWith(suffix)) throw new Error('Unsupported mount shape; update benchmark discovery');
        const mount = source.slice(1, -suffix.length).replaceAll('\\/', '/');
        if (mount && !/^\/[a-zA-Z0-9/_-]+$/.test(mount)) throw new Error('Unsupported dynamic mount; update benchmark discovery');
        walk(layer.handle.stack, prefix + mount);
      }
    }
  }
  walk(app._router.stack, '');
  return found;
}

try {
  const [mode, host] = process.argv.slice(2);
  if (!['benchmark', 'default'].includes(mode) || !['127.0.0.1', '::1'].includes(host)) {
    throw new Error('Invalid isolated server mode or loopback bind');
  }
  const app = mode === 'default' ? createApp() : createApp({
    rateLimiter: rateLimit({ windowMs: 15 * 60 * 1000, limit: 1100, standardHeaders: 'draft-7', legacyHeaders: false })
  });
  const routes = inventory(app);
  const server = app.listen(0, host);
  let closing = false;
  function stop() {
    if (closing) return;
    closing = true;
    server.closeAllConnections();
    server.close(() => process.exit(0));
  }
  process.on('message', (message) => { if (message?.type === 'stop') stop(); });
  process.on('disconnect', stop);
  process.on('SIGTERM', stop);
  server.on('error', (error) => {
    process.send?.({ type: 'error', code: error.code ?? 'SERVER' });
    process.exitCode = 1;
    stop();
  });
  server.once('listening', () => {
    process.send({
      type: 'ready', port: server.address().port, routes,
      token: signAccessToken({ sub: 'benchmark-admin', role: 'admin' })
    });
  });
} catch (error) {
  process.send?.({ type: 'error', code: error.code ?? 'STARTUP', message: error.message });
  process.exit(1);
}
