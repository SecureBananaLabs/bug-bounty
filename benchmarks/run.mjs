import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fork, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { positiveInteger, targetUrl, discoverEndpoints, assertCoverage, requestOnce, measure, violations, markdown } from './lib.mjs';

const root = new URL('../', import.meta.url);
try { process.loadEnvFile(fileURLToPath(new URL('.env.benchmark', root))); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const smoke = process.argv.includes('--smoke');
const endpoints = JSON.parse(await readFile(new URL('endpoints.json', import.meta.url)));
const thresholds = JSON.parse(await readFile(new URL('thresholds.json', import.meta.url)));
assertCoverage(endpoints, await discoverEndpoints(root));
const options = {
  requests: smoke ? 30 : positiveInteger(process.env.BENCHMARK_REQUESTS, 10000, 10000),
  concurrency: smoke ? 1 : positiveInteger(process.env.BENCHMARK_CONCURRENCY, 4, 64),
  timeoutMs: positiveInteger(process.env.BENCHMARK_TIMEOUT_MS, 5000, 30000)
};
let child, target, token = process.env.BENCHMARK_TOKEN;
const external = !!process.env.BENCHMARK_TARGET;
try {
  if (external) {
    target = targetUrl(process.env.BENCHMARK_TARGET, process.env.BENCHMARK_ALLOW_REMOTE === 'true');
    if (!token) throw new Error('BENCHMARK_TOKEN must be a dedicated test token for the configured staging API');
  } else {
    child = fork(new URL('server.mjs', import.meta.url), { cwd: fileURLToPath(root), env: { ...process.env, NODE_ENV: 'test' }, stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
    const ready = await Promise.race([
      once(child, 'message'),
      once(child, 'exit').then(([code]) => { throw new Error(`Local API exited before ready: ${code}`); }),
      new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('Local API startup timed out')), 15000); timer.unref(); })
    ]);
    target = targetUrl(`http://127.0.0.1:${ready[0].port}`, false);
    token = ready[0].token;
    // Seed representative nonempty collections before GET workloads. This is never run on a remote target.
    for (const endpoint of endpoints.filter(e => e.seedCollection)) {
      for (let i = 0; i < 50; i++) {
        const fixture = { ...endpoint, body: { ...endpoint.body, ...(endpoint.path === '/api/users' ? { email: `benchmark-${i}@example.invalid` } : {}) } };
        const response = await requestOnce(target, fixture, { token, timeoutMs: options.timeoutMs });
        if (response.failed) throw new Error(`Seed failed: ${endpoint.path}, status ${response.status}`);
      }
    }
  }
  // Reject invalid auth, wrong fixtures or an unavailable API before collecting a misleading baseline.
  for (const endpoint of endpoints) {
    const response = await requestOnce(target, endpoint, { token, timeoutMs: options.timeoutMs });
    if (response.failed) throw new Error(`Preflight failed: ${endpoint.method} ${endpoint.path}, status ${response.status}`);
  }
  const report = {
    recordedAt: new Date().toISOString(), commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
    mode: smoke ? 'smoke' : 'baseline', targetKind: external ? 'configured isolated staging API' : 'isolated loopback API',
    runtimeDescription: external ? 'Metrics describe the configured staging target; fixture data and API quota are configured by its operator.' : 'Current Express API and middleware, with in-memory service arrays and placeholder database/search/payment integrations. Benchmark server limit:1,000,000requests/15min. Normal server default remains200. Each invocation starts a fresh process; collections are seeded with50records.',
    environment: { node: process.version, platform: os.platform(), release: os.release(), arch: os.arch(), cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, totalMemoryBytes: os.totalmem(), freeMemoryBytesAtStart: os.freemem() },
    options, notes: 'Closed-loop fixed-count workload. Peak uses full one-second completion buckets; a subsecond run uses its overall rate. TTFB is time to parsed response headers. Latency includes body drain; timed-out/network/nonexpected-status requests count as errors. Other workstation activity was not isolated.',
    results: [], failures: []
  };
  for (const endpoint of endpoints) {
    const result = await measure(target, endpoint, { ...options, token });
    report.results.push(result);
    report.failures.push(...violations(result, thresholds, smoke).map(f => `${result.endpoint}: ${f}`));
    console.log(`${result.endpoint}: p99=${result.p99Ms.toFixed(2)}ms RPS=${result.sustainedRps.toFixed(2)} errors=${result.errorRatePercent.toFixed(2)}%`);
  }
  const dir = new URL('results/', import.meta.url);
  await mkdir(dir, { recursive: true });
  const name = report.recordedAt.replaceAll(':', '-') + '-' + report.mode;
  await writeFile(new URL(name + '.json', dir), JSON.stringify(report, null, 2) + '\n');
  await writeFile(new URL(name + '.md', dir), markdown(report));
  console.log(`Report: benchmarks/results/${name}.md\nGate: ${report.failures.length ? 'FAIL' : 'PASS'}`);
  if (report.failures.length) { console.error(report.failures.join('\n')); process.exitCode = 1; }
} finally {
  if (child && child.exitCode === null) {
    child.kill('SIGTERM');
    const timer = setTimeout(() => child.kill('SIGKILL'), 3000); timer.unref();
    await once(child, 'exit'); clearTimeout(timer);
  }
}
