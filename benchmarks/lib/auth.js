'use strict';

/**
 * Benchmark auth helper: issues a dedicated benchmark admin JWT when the
 * app can't be started in-process (remote target), or returns a static
 * benchmark token for the local in-process run.
 *
 * The API's JWT middleware accepts any well-formed token signed with the
 * configured JWT_SECRET. In local mode we reuse an env-provided secret to
 * mint one directly.
 */
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

function loadEnvBenchmark(projectRoot) {
  const envPath = path.join(projectRoot, 'benchmarks', '.env.benchmark');
  const out = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

function mintBenchmarkToken(secret, userId) {
  return jwt.sign(
    { sub: userId || 'benchmark-user', role: 'user', benchmark: true },
    secret,
    { expiresIn: '1h' }
  );
}

async function getAuthToken({ projectRoot, localSecret }) {
  const env = loadEnvBenchmark(projectRoot);
  const secret = localSecret || env.BENCHMARK_JWT_SECRET || process.env.JWT_SECRET || 'development-secret';
  return mintBenchmarkToken(secret);
}

module.exports = { getAuthToken, mintBenchmarkToken, loadEnvBenchmark };