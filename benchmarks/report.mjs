import os from 'node:os';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export function evaluateReport(report, expectedIds) {
  const ids = report.endpoints.map((endpoint) => endpoint.id);
  return report.failures.length === 0
    && report.controls.defaultLimiter?.passed === true && report.controls.invalidToken?.passed === true
    && new Set(ids).size === ids.length && ids.length === expectedIds.length
    && expectedIds.every((id) => ids.includes(id))
    && report.endpoints.every((endpoint) => endpoint.samples > 0 && endpoint.gate?.passed === true);
}

const fixed = (value) => Number.isFinite(value) ? value.toFixed(2) : 'N/A';
const cell = (value) => String(value ?? 'UNKNOWN').replaceAll('|', '\\|').replaceAll('\n', ' ');

export function toMarkdown(report) {
  const lines = [
    '# Local API benchmark', '',
    `**Result: ${report.passed ? 'PASS' : 'FAIL'}** | ${report.mode} | ${report.generatedAt}`, '',
    '> Scope: synthetic fixtures, in-memory collections and placeholder auth, search, database and payment integrations. These are loopback measurements of this build, not production database, OAuth or Stripe performance.', '',
    `Source commit: \`${report.source?.commit ?? 'UNKNOWN'}\`; dirty: ${report.source?.dirty ?? 'UNKNOWN'}.`,
    `Input SHA-256: \`${report.source?.digest ?? 'UNKNOWN'}\`.`, '',
    `Per endpoint: ${report.config.requests} measured attempts, concurrency ${report.config.concurrency}, target ${report.config.rate} requests/s (0 means unpaced). Setup, seed and warmup requests are excluded.`, '',
    '| Endpoint | Samples | Request bytes | p50 ms | p95 ms | p99 ms | TTFB p50 / p95 / p99 ms | Sustained RPS | Peak RPS | Error % | Gate |',
    '| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- |'
  ];
  for (const e of report.endpoints) {
    lines.push(`| ${cell(e.method)} ${cell(e.route)} | ${e.samples ?? 0} | ${e.requestBytes ?? 'N/A'} | ${fixed(e.latencyMs?.p50)} | ${fixed(e.latencyMs?.p95)} | ${fixed(e.latencyMs?.p99)} | ${fixed(e.ttfbMs?.p50)} / ${fixed(e.ttfbMs?.p95)} / ${fixed(e.ttfbMs?.p99)} | ${fixed(e.rps?.sustained)} | ${fixed(e.rps?.peak)} | ${fixed(e.errorRatePct)} | ${e.gate?.passed ? 'PASS' : 'FAIL'} |`);
  }
  lines.push('', '## Interpretation', '',
    '- Latency is request start through complete response body or failure. TTFB is request start through first socket response byte. Both use a monotonic clock; values are not substituted for one another.',
    '- Percentiles use nearest rank. Failed attempts remain in latency and error accounting; TTFB has a separate sample count because requests without a first byte cannot provide TTFB.',
    '- Sustained RPS is measured completions / elapsed seconds, including failures; successful RPS is also in JSON. Peak is the maximum complete one-second completion bucket. The final partial bucket is excluded; a run under one second reports sustained RPS as peak with its actual window length in JSON.',
    '- Offered traffic follows the configured start schedule subject to bounded concurrency. These rates are observed throughput at this load, not a claim of saturation capacity. The client shares the host with the API.',
    '- Low-concurrency smoke uses small samples and broad reviewed thresholds. It detects gross regressions; it cannot establish a precise production p99 or statistical significance.', '',
    '## Controls', '',
    `Default production limiter: ${report.controls.defaultLimiter?.passed ? 'PASS (200 allowed, request 201 returned 429; 900-second policy)' : 'NOT PASSED'}.`,
    `Incorrect JWT: ${report.controls.invalidToken?.passed ? 'PASS (401 rejected)' : 'NOT PASSED'}.`, '',
    '## Environment', '', '| Field | Value |', '| --- | --- |'
  );
  for (const [key, value] of Object.entries(report.environment ?? {})) lines.push(`| ${cell(key)} | ${cell(typeof value === 'object' ? JSON.stringify(value) : value)} |`);
  const failures = [...(report.failures ?? [])];
  for (const endpoint of report.endpoints) {
    for (const reason of endpoint.gate?.reasons ?? []) failures.push(`${endpoint.id}: ${reason}`);
  }
  lines.push('', '## Gate details', '');
  if (failures.length) lines.push(...failures.map((reason) => `- ${cell(reason)}`));
  else lines.push('All endpoint, sample, threshold and control checks passed for this local run.');
  lines.push('', '## Limitations', '',
    'No live credentials or external integrations were used. The worker environment supplies a fresh test-only JWT secret. Dedicated tokens, passwords, response bodies and full environment variables are intentionally absent from reports. Upstream CI, maintainer acceptance and bounty payment are separate outcomes.', '');
  return lines.join('\n');
}

async function optionalFile(filename) {
  try { return (await readFile(filename, 'utf8')).trim(); } catch { return 'UNKNOWN'; }
}

export async function metadata() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const files = ['package.json', 'package-lock.json', 'apps/api/package.json'];
  async function walk(relative) {
    for (const entry of (await readdir(path.join(root, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === 'results' || entry.name.startsWith('.env')) continue;
      const name = path.join(relative, entry.name);
      if (entry.isDirectory()) await walk(name);
      else if (entry.isFile()) files.push(name);
    }
  }
  await walk('apps/api/src');
  await walk('benchmarks');
  const hash = createHash('sha256');
  for (const file of files.sort()) hash.update(file).update('\0').update(await readFile(path.join(root, file))).update('\0');
  let commit = 'UNKNOWN';
  let dirty = 'UNKNOWN';
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    dirty = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() !== '';
  } catch { /* Source archives can still be identified by the input digest. */ }
  const cpus = os.cpus();
  return {
    source: { commit, dirty, digest: hash.digest('hex'), algorithm: 'sha256(sorted path + NUL + bytes + NUL)', files },
    environment: {
      node: process.version, os: `${os.type()} ${os.release()} ${os.arch()}`, osRelease: await optionalFile('/etc/os-release'),
      cpuModel: cpus[0]?.model ?? 'UNKNOWN', logicalCpus: cpus.length, availableParallelism: os.availableParallelism(),
      hostMemoryTotalBytes: os.totalmem(), hostMemoryFreeBytesAtStart: os.freemem(),
      cgroupMemoryMax: await optionalFile('/sys/fs/cgroup/memory.max'),
      cgroupMemoryCurrentAtStart: await optionalFile('/sys/fs/cgroup/memory.current'),
      cgroupCpuMax: await optionalFile('/sys/fs/cgroup/cpu.max'),
      storageType: 'UNKNOWN (not probed)', network: 'loopback',
      machine: process.env.GITHUB_ACTIONS === 'true' ? 'GitHub Actions runner' : 'execution host; instance type UNKNOWN',
      otherSignificantProcesses: 'UNKNOWN; shared host interference is possible'
    }
  };
}

export async function writeReports(report, directory) {
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'latest.json'), JSON.stringify(report, null, 2) + '\n');
  await writeFile(path.join(directory, 'latest.md'), toMarkdown(report));
}
