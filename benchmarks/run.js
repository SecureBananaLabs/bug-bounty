#!/usr/bin/env node
/**
 * Benchmarks every `/api/` endpoint and writes a reproducible report.
 *
 *   npm run benchmark              full suite
 *   npm run benchmark:smoke        low concurrency, used as the CI gate
 *
 * Captures p50/p95/p99 latency, requests per second (peak and sustained),
 * error rate and TTFB per endpoint, then compares p99 against
 * `thresholds.json` so a regression fails the run instead of being noticed in
 * production.
 *
 * Configuration comes from `.env.benchmark` (see `.env.benchmark.example`).
 */

import autocannon from "autocannon";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";

import { endpoints } from "./endpoints.js";

const here = dirname(fileURLToPath(import.meta.url));
const smoke = process.argv.includes("--smoke");

const config = {
  target: process.env.BENCHMARK_TARGET ?? "http://localhost:4000",
  connections: Number(process.env.BENCHMARK_CONNECTIONS ?? (smoke ? 5 : 50)),
  duration: Number(process.env.BENCHMARK_DURATION ?? (smoke ? 3 : 10)),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  timeout: 10
};

/**
 * A token for the auth-protected routes.
 *
 * Signed locally with the same secret the API verifies against: benchmarking
 * must not depend on a seeded user existing, and a login round-trip inside the
 * measurement would attribute the auth cost to every endpoint.
 */
function benchmarkToken() {
  return jwt.sign(
    { sub: "benchmark-user", email: "bench@example.com", role: "user", benchmark: true },
    config.jwtSecret,
    { expiresIn: "1h" }
  );
}

/** Percentile helper: autocannon reports what we need, this keeps names stable. */
function latency(result) {
  return {
    p50_ms: result.latency.p50,
    p95_ms: result.latency.p97_5 ?? result.latency.p95 ?? null,
    p99_ms: result.latency.p99,
    mean_ms: result.latency.mean,
    max_ms: result.latency.max
  };
}

async function measure(endpoint, token) {
  const options = {
    url: `${config.target}${endpoint.path}`,
    method: endpoint.method,
    connections: config.connections,
    duration: config.duration,
    timeout: config.timeout,
    headers: {
      "content-type": "application/json",
      ...(endpoint.auth ? { authorization: `Bearer ${token}` } : {})
    }
  };
  if (endpoint.body) options.body = JSON.stringify(endpoint.body);

  const result = await autocannon(options);
  const total = result.requests.total ?? 0;
  // Cero peticiones completadas significa que no hay nadie al otro lado. El
  // calculo anterior dividia entre uno para no romperse y publicaba cosas como
  // "1849300% errors", que no dicen nada: lo que hay que decir es que el
  // objetivo dejo de responder.
  if (total === 0) {
    return {
      name: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      authenticated: Boolean(endpoint.auth),
      unreachable: true,
      latency: { p50_ms: null, p95_ms: null, p99_ms: null, mean_ms: null, max_ms: null },
      ttfb_ms: null,
      requests_per_second: { sustained: 0, peak: 0 },
      throughput_bytes_per_second: 0,
      requests: { total: 0, failed: result.errors ?? 0, rate_limited: 0, non2xx: 0,
                  timeouts: result.timeouts ?? 0 },
      error_rate_pct: 100,
      rate_limited_pct: 0
    };
  }
  // Un 429 no es un endpoint roto: es el limitador haciendo su trabajo. Se
  // cuenta aparte porque mezclarlo con los errores esconde el unico dato que
  // importa cuando toda la suite sale en rojo, que es que no se ha llegado a
  // medir nada.
  const rateLimited = result.statusCodeStats?.["429"]?.count ?? 0;
  const failed =
    Math.max(0, (result.non2xx ?? 0) - rateLimited) + (result.errors ?? 0) + (result.timeouts ?? 0);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    authenticated: Boolean(endpoint.auth),
    latency: latency(result),
    // TTFB is the first byte back; with keep-alive connections autocannon's
    // first latency sample is the closest honest measure we have.
    ttfb_ms: result.latency.min,
    requests_per_second: {
      sustained: result.requests.average,
      peak: result.requests.max
    },
    throughput_bytes_per_second: result.throughput.average,
    requests: {
      total, failed, rate_limited: rateLimited,
      non2xx: result.non2xx ?? 0, timeouts: result.timeouts ?? 0
    },
    error_rate_pct: Number(((failed / total) * 100).toFixed(2)),
    rate_limited_pct: Number(((rateLimited / total) * 100).toFixed(2))
  };
}

function readThresholds() {
  try {
    return JSON.parse(readFileSync(join(here, "thresholds.json"), "utf8"));
  } catch {
    return { default: {}, endpoints: {} };
  }
}

/**
 * Compares a measurement against its threshold.
 *
 * An endpoint without its own entry falls back to `default`, so adding a route
 * cannot silently escape the gate.
 */
function check(measurement, thresholds) {
  const limits = { ...thresholds.default, ...(thresholds.endpoints?.[measurement.name] ?? {}) };
  const breaches = [];
  if (measurement.unreachable) {
    return ["the target stopped answering: no request completed"];
  }
  if (limits.p99_ms != null && measurement.latency.p99_ms > limits.p99_ms) {
    breaches.push(`p99 ${measurement.latency.p99_ms}ms > ${limits.p99_ms}ms`);
  }
  if (limits.error_rate_pct != null && measurement.error_rate_pct > limits.error_rate_pct) {
    breaches.push(`error rate ${measurement.error_rate_pct}% > ${limits.error_rate_pct}%`);
  }
  // Medir a traves del limitador no mide la API, mide el limitador. Se avisa
  // en vez de publicar unas cifras que no significan nada.
  if (measurement.rate_limited_pct > 50) {
    breaches.push(
      `${measurement.rate_limited_pct}% of requests were rate limited: ` +
      "raise RATE_LIMIT_MAX for the benchmark target, these numbers measure the limiter"
    );
  }
  if (limits.min_rps != null && measurement.requests_per_second.sustained < limits.min_rps) {
    breaches.push(`${Math.round(measurement.requests_per_second.sustained)} req/s < ${limits.min_rps}`);
  }
  return breaches;
}

function markdown(report) {
  const rows = report.endpoints
    .map((e) => {
      const status = e.breaches.length ? `⚠️ ${e.breaches.join("; ")}` : "ok";
      if (e.unreachable) {
        return `| \`${e.method} ${e.path}\` | — | — | — | — | — | — | — | ${status} |`;
      }
      return `| \`${e.method} ${e.path}\` | ${e.latency.p50_ms} | ${e.latency.p95_ms} | ` +
        `${e.latency.p99_ms} | ${e.ttfb_ms} | ${Math.round(e.requests_per_second.sustained)} | ` +
        `${Math.round(e.requests_per_second.peak)} | ${e.error_rate_pct}% | ${status} |`;
    })
    .join("\n");

  return `# API benchmark — ${report.startedAt}

Target \`${report.config.target}\` · ${report.config.connections} connections · \
${report.config.duration}s per endpoint${report.smoke ? " · smoke run" : ""}.

| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | TTFB (ms) | req/s | peak req/s | errors | vs threshold |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${rows}

${report.failed.length
    ? `## Threshold breaches\n\n${report.failed.map((f) => `- \`${f.name}\`: ${f.breaches.join("; ")}`).join("\n")}\n`
    : "All endpoints are within the thresholds in `benchmarks/thresholds.json`.\n"}
Re-run with \`npm run benchmark\` to compare against this baseline.
`;
}

async function main() {
  const thresholds = readThresholds();
  const token = benchmarkToken();
  const startedAt = new Date().toISOString();
  const measurements = [];

  for (const endpoint of endpoints) {
    process.stdout.write(`  ${endpoint.method} ${endpoint.path} … `);
    const measurement = await measure(endpoint, token);
    measurement.breaches = check(measurement, thresholds);
    measurements.push(measurement);
    if (measurement.unreachable) {
      console.log("no answer — the target is down");
      // Seguir midiendo contra un servidor caido produce quince filas de ceros
      // y esconde el unico dato util, que es donde dejo de responder.
      console.error(
        `
The target stopped answering at ${endpoint.method} ${endpoint.path}. ` +
        "Everything after this point would be measuring nothing, so the run stops here."
      );
      break;
    }
    console.log(
      `p99 ${measurement.latency.p99_ms}ms, ` +
      `${Math.round(measurement.requests_per_second.sustained)} req/s, ` +
      `${measurement.error_rate_pct}% errors` +
      (measurement.breaches.length ? "  ⚠️" : "")
    );
  }

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    smoke,
    config: { target: config.target, connections: config.connections, duration: config.duration },
    endpoints: measurements,
    failed: measurements.filter((m) => m.breaches.length).map((m) => ({ name: m.name, breaches: m.breaches }))
  };

  const stamp = startedAt.replace(/[:.]/g, "-");
  const results = join(here, "results");
  mkdirSync(results, { recursive: true });
  writeFileSync(join(results, `${stamp}.json`), JSON.stringify(report, null, 2));
  writeFileSync(join(results, `${stamp}.md`), markdown(report));
  writeFileSync(join(results, "latest.json"), JSON.stringify(report, null, 2));
  writeFileSync(join(results, "latest.md"), markdown(report));

  console.log(`\nReport written to benchmarks/results/${stamp}.md`);

  if (report.failed.length) {
    console.error(`\n${report.failed.length} endpoint(s) exceeded their threshold.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Benchmark run failed:", error.message);
  process.exit(1);
});
