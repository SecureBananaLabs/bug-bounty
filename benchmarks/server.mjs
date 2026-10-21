import { fork } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { scenarios } from './scenarios.mjs';
import { requestOnce } from './core.mjs';

export async function startServer({ mode = 'benchmark', host = '127.0.0.1' } = {}) {
  if (!['127.0.0.1', '::1'].includes(host)) throw new Error('Only loopback binds are allowed');
  if (!['benchmark', 'default'].includes(mode)) throw new Error('Invalid server mode');
  // No deployment credentials or NODE_OPTIONS are inherited by the API process.
  const child = fork(new URL('./worker.mjs', import.meta.url), [mode, host], {
    execArgv: [], stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    env: {
      PATH: process.env.PATH ?? '', NODE_ENV: 'test', BENCHMARK_CHILD: '1',
      JWT_SECRET: randomBytes(32).toString('hex'), DATABASE_URL: '', STRIPE_SECRET_KEY: ''
    }
  });
  const killOnParentExit = () => child.kill('SIGKILL');
  process.once('exit', killOnParentExit);
  let stopPromise;
  const stop = () => {
    if (stopPromise) return stopPromise;
    stopPromise = new Promise((resolve) => {
      process.removeListener('exit', killOnParentExit);
      if (child.exitCode !== null || child.signalCode !== null) return resolve();
      const deadline = setTimeout(() => child.kill('SIGKILL'), 1000);
      child.once('exit', () => { clearTimeout(deadline); resolve(); });
      if (child.connected) child.send({ type: 'stop' }, (error) => { if (error) child.kill('SIGKILL'); });
      else child.kill('SIGKILL');
    });
    return stopPromise;
  };
  try {
    const info = await new Promise((resolve, reject) => {
      const deadline = setTimeout(() => reject(new Error('API startup timeout')), 5000);
      function clear() {
        clearTimeout(deadline);
        child.removeListener('error', failed);
        child.removeListener('exit', exited);
        child.removeListener('message', ready);
      }
      function failed(error) { clear(); reject(error); }
      function exited(code) { clear(); reject(new Error(`API exited before ready (${code})`)); }
      function ready(message) {
        if (message?.type === 'ready') { clear(); resolve(message); }
        else if (message?.type === 'error') failed(new Error(`API startup failed: ${message.code}: ${message.message ?? ''}`));
      }
      child.once('error', failed);
      child.once('exit', exited);
      child.on('message', ready);
    });
    return { url: `http://${host.includes(':') ? `[${host}]` : host}:${info.port}`, token: info.token, routes: info.routes, stop };
  } catch (error) { await stop(); throw error; }
}

export async function prepareScenario(server, scenario, { warmup = 5, timeoutMs = 1000 } = {}) {
  if (!Number.isInteger(warmup) || warmup < 0 || warmup > 20) throw new Error('Invalid warmup count');
  const context = { token: server.token, password: randomBytes(24).toString('hex'), sequence: 0 };
  if (scenario.seedWith) {
    const seed = scenarios.find((item) => item.id === scenario.seedWith);
    if (!seed) throw new Error(`Missing seed scenario for ${scenario.id}`);
    for (let i = 0; i < 3; i++) {
      const sample = await requestOnce({ url: server.url, scenario: seed, context: { ...context, sequence: i }, timeoutMs });
      if (!sample.ok) throw new Error(`Seed failed for ${scenario.id}: ${sample.error} (${sample.statusCode})`);
    }
  }
  for (let i = 0; i <= warmup; i++) {
    const sample = await requestOnce({ url: server.url, scenario, context, timeoutMs });
    if (!sample.ok) throw new Error(`Semantic preflight/warmup failed for ${scenario.id}: ${sample.error} (${sample.statusCode})`);
  }
  return context;
}

export async function checkDefaultLimiter({ host = '127.0.0.1' } = {}) {
  const server = await startServer({ mode: 'default', host });
  try {
    let policy;
    for (let i = 1; i <= 201; i++) {
      const response = await fetch(`${server.url}/health`, { redirect: 'error', signal: AbortSignal.timeout(1000) });
      policy = response.headers.get('ratelimit-policy');
      const status = response.status;
      await response.arrayBuffer();
      const expected = i <= 200 ? 200 : 429;
      if (status !== expected || policy !== '200;w=900') throw new Error(`Default limiter check failed at request ${i} (${status})`);
    }
    return { passed: true, allowed: 200, blockedStatus: 429, policy };
  } finally { await server.stop(); }
}
