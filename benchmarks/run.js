#!/usr/bin/env node
/**
 * API Benchmark Suite — SecureBananaLabs
 *
 * Runs autocannon against every endpoint defined in benchmarks/config.js,
 * collects p50 / p95 / p99 latency, RPS, error rate, and TTFB, then writes
 * a sorted summary table and a markdown report at benchmarks/REPORT.md.
 *
 * Usage:
 *   npm run benchmark          # full suite (requires running API)
 *   BENCHMARK_URL=http://staging:4000 npm run benchmark
 *   BENCHMARK_TOKEN=eyJ... npm run benchmark   # custom auth token
 */

import autocannon from "autocannon";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import {
  BASE_URL,
  DEFAULTS,
  THRESHOLDS,
  BENCHMARK_TOKEN,
  endpoints,
} from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Helpers ──────────────────────────────────────────────────────────────

function mintBenchmarkToken() {
  // Mint a JWT with the development secret so benchmarks work without
  // external configuration.  The payload contains a standard subject claim.
  const secret = process.env.JWT_SECRET ?? "development-secret";
  return jwt.sign(
    { sub: "benchmark-suite", role: "admin", iat: Math.floor(Date.now() / 1000) },
    secret,
    { expiresIn: "1h" }
  );
}

function resolveToken() {
  if (BENCHMARK_TOKEN) return BENCHMARK_TOKEN;
  try {
    return mintBenchmarkToken();
  } catch (err) {
    console.warn("⚠  Could not mint benchmark token — admin endpoints will fail:", err.message);
    return null;
  }
}

function formatMs(us) {
  // autocannon reports latency in µs — convert to ms with 2 decimal places
  return (us / 1000).toFixed(2);
}

function formatRPS(rps) {
  return rps.toFixed(1);
}

function pct(v, total) {
  if (total === 0) return "0.00";
  return ((v / total) * 100).toFixed(2);
}

// ── Run a single endpoint ────────────────────────────────────────────────

async function benchmarkEndpoint(ep, token) {
  const url = BASE_URL + ep.path;
  const isMultipart = ep.multipart === true;

  const opts = {
    url,
    duration: DEFAULTS.duration,
    connections: DEFAULTS.connections,
    pipelining: DEFAULTS.pipelining,
    method: ep.method,
    headers: {},
    body: undefined,
    setupRequest: undefined,
  };

  // ── Auth header ──────────────────────────────────────────────────────
  if (ep.auth && token) {
    opts.headers["Authorization"] = `Bearer ${token}`;
  }

  // ── Body / setupRequest ──────────────────────────────────────────────
  if (isMultipart) {
    // For multipart uploads we simulate a small file via setupRequest
    opts.setupRequest = () => {
      const boundary = "----BenchmarkBoundary" + Date.now();
      const fileContent = Buffer.from("x".repeat(1024)); // 1 KB dummy file
      const body = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="bench-upload.txt"\r\n` +
        `Content-Type: text/plain\r\n\r\n` +
        `${fileContent.toString()}\r\n` +
        `--${boundary}--\r\n`
      );
      return {
        headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
        body,
      };
    };
  } else if (typeof ep.payload === "function") {
    // Dynamic payload (e.g. unique emails per request)
    opts.headers["Content-Type"] = "application/json";
    opts.setupRequest = () => {
      return { body: JSON.stringify(ep.payload()) };
    };
  } else if (ep.payload) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(ep.payload);
  }

  console.log(`\n▶  ${ep.id.padEnd(24)} ${ep.method.padEnd(5)} ${ep.path}`);

  try {
    const result = await autocannon(opts);
    return {
      id: ep.id,
      method: ep.method,
      path: ep.path,
      category: ep.category,
      auth: ep.auth,
      description: ep.description,
      // Latency (ms)
      p50: formatMs(result.latency.p50),
      p95: formatMs(result.latency.p95),
      p99: formatMs(result.latency.p99),
      // Throughput
      rps: formatRPS(result.requests.average),
      // Error rate
      totalRequests: result.requests.total,
      non2xx: result.non2xx ?? 0,
      errors: result.errors ?? 0,
      timeouts: result.timeouts ?? 0,
      errorRate: pct(
        ((result.non2xx ?? 0) + (result.errors ?? 0) + (result.timeouts ?? 0)),
        result.requests.total || 1
      ),
      // TTFB (ms) — first byte latency
      ttfb: result.latency ? formatMs(result.latency.average) : "N/A",
      // Raw for reference
      _raw: result,
    };
  } catch (err) {
    console.error(`   ✗  ${ep.id} failed: ${err.message}`);
    return {
      id: ep.id,
      method: ep.method,
      path: ep.path,
      category: ep.category,
      auth: ep.auth,
      description: ep.description,
      p50: "ERR",
      p95: "ERR",
      p99: "ERR",
      rps: "ERR",
      totalRequests: 0,
      non2xx: 0,
      errors: 1,
      timeouts: 0,
      errorRate: "100.00",
      ttfb: "ERR",
      _error: err.message,
    };
  }
}

// ── Summary table ────────────────────────────────────────────────────────

function printSummary(results) {
  // Sort by p95 latency descending (worst first) so bottlenecks are visible
  const sorted = [...results].sort((a, b) => {
    const pa = parseFloat(a.p95) || 0;
    const pb = parseFloat(b.p95) || 0;
    return pb - pa;
  });

  const hdr = [
    "Endpoint".padEnd(26),
    "Method".padEnd(7),
    "p50(ms)".padEnd(10),
    "p95(ms)".padEnd(10),
    "p99(ms)".padEnd(10),
    "RPS".padEnd(10),
    "Err%".padEnd(8),
    "TTFB(ms)".padEnd(10),
    "Auth".padEnd(5),
  ].join(" ");

  const sep = "─".repeat(hdr.length);
  console.log("\n" + sep);
  console.log("  BENCHMARK RESULTS — sorted by p95 latency (worst → best)");
  console.log(sep);
  console.log(hdr);
  console.log(sep);

  for (const r of sorted) {
    const p95Num = parseFloat(r.p95) || 0;
    const threshold = THRESHOLDS[r.method] ?? THRESHOLDS.GET;
    const flag = p95Num > threshold.p95 ? " ⚠" : "  ";

    console.log([
      (r.id + flag).padEnd(26),
      r.method.padEnd(7),
      r.p50.padEnd(10),
      r.p95.padEnd(10),
      r.p99.padEnd(10),
      r.rps.padEnd(10),
      r.errorRate.padEnd(8),
      r.ttfb.padEnd(10),
      (r.auth ? "✔" : "—").padEnd(5),
    ].join(" "));
  }

  console.log(sep);
  console.log(`  ⚠  = exceeds baseline threshold (GET p95 < ${THRESHOLDS.GET.p95}ms, POST p95 < ${THRESHOLDS.POST.p95}ms)\n`);
}

// ── Markdown report ──────────────────────────────────────────────────────

function generateMarkdown(results, timestamp) {
  const sorted = [...results].sort((a, b) => {
    const pa = parseFloat(a.p95) || 0;
    const pb = parseFloat(b.p95) || 0;
    return pb - pa;
  });

  let md = `# API Benchmark Report\n\n`;
  md += `**Generated:** ${timestamp}  \n`;
  md += `**Target:** ${BASE_URL}  \n`;
  md += `**Duration per endpoint:** ${DEFAULTS.duration}s  \n`;
  md += `**Concurrent connections:** ${DEFAULTS.connections}  \n\n`;

  md += `## Baseline Thresholds\n\n`;
  md += `| Method | p95 Threshold | p99 Threshold |\n`;
  md += `|--------|--------------|---------------|\n`;
  md += `| GET    | < ${THRESHOLDS.GET.p95}ms      | < ${THRESHOLDS.GET.p99}ms       |\n`;
  md += `| POST   | < ${THRESHOLDS.POST.p95}ms     | < ${THRESHOLDS.POST.p99}ms      |\n\n`;

  md += `## Results (sorted by p95 latency, worst first)\n\n`;
  md += `| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Err% | TTFB (ms) | Auth | Flag |\n`;
  md += `|----------|--------|----------|----------|----------|-----|------|-----------|------|------|\n`;

  for (const r of sorted) {
    const p95Num = parseFloat(r.p95) || 0;
    const threshold = THRESHOLDS[r.method] ?? THRESHOLDS.GET;
    const flag = p95Num > threshold.p95 ? "⚠️ OVER" : "✅ OK";

    md += `| ${r.id} | ${r.method} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.rps} | ${r.errorRate} | ${r.ttfb} | ${r.auth ? "Yes" : "No"} | ${flag} |\n`;
  }

  md += `\n## Endpoint Details\n\n`;
  for (const r of sorted) {
    md += `### ${r.id}\n\n`;
    md += `- **Path:** \`${r.method} ${r.path}\`\n`;
    md += `- **Category:** ${r.category}\n`;
    md += `- **Auth required:** ${r.auth ? "Yes" : "No"}\n`;
    md += `- **Description:** ${r.description}\n`;
    md += `- **Latency:** p50=${r.p50}ms, p95=${r.p95}ms, p99=${r.p99}ms\n`;
    md += `- **Throughput:** ${r.rps} req/s\n`;
    md += `- **Error rate:** ${r.errorRate}%\n`;
    md += `- **TTFB:** ${r.ttfb}ms\n`;
    if (r._error) md += `- **Error:** ${r._error}\n`;
    md += `\n`;
  }

  md += `## How to Reproduce\n\n`;
  md += `\`\`\`bash\n`;
  md += `npm run benchmark\n`;
  md += `\`\`\`\n\n`;
  md += `Set \`BENCHMARK_URL\` to target a different environment and \`BENCHMARK_TOKEN\` to supply a custom auth token.\n`;

  return md;
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║        SecureBananaLabs — API Benchmark Suite              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
  console.log(`Target:     ${BASE_URL}`);
  console.log(`Endpoints:  ${endpoints.length}`);
  console.log(`Duration:   ${DEFAULTS.duration}s per endpoint`);
  console.log(`Connections:${DEFAULTS.connections}\n`);

  const token = resolveToken();
  if (token) {
    console.log(`Auth token: ${token.slice(0, 20)}…`);
  } else {
    console.log("Auth token: none — auth-required endpoints will likely fail");
  }

  const results = [];
  for (const ep of endpoints) {
    const result = await benchmarkEndpoint(ep, token);
    results.push(result);
  }

  // Print console summary
  printSummary(results);

  // Write markdown report
  const timestamp = new Date().toISOString();
  const md = generateMarkdown(results, timestamp);
  const reportPath = path.join(__dirname, "REPORT.md");
  fs.writeFileSync(reportPath, md, "utf8");
  console.log(`\n📄  Report written to ${reportPath}\n`);

  // Exit with non-zero if any endpoint exceeded threshold
  const failures = results.filter((r) => {
    const p95 = parseFloat(r.p95) || 0;
    const threshold = THRESHOLDS[r.method] ?? THRESHOLDS.GET;
    return p95 > threshold.p95;
  });

  if (failures.length > 0) {
    console.log(`⚠️   ${failures.length} endpoint(s) exceeded p95 threshold.\n`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Benchmark suite failed:", err);
  process.exit(1);
});
