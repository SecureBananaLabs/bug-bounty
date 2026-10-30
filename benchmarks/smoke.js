#!/usr/bin/env node
/**
 * CI smoke benchmark (regression gate).
 *
 * Runs a low-concurrency pass over a representative endpoint subset and fails
 * (exit 1) if any endpoint's p99 latency exceeds its threshold in
 * benchmarks/thresholds.json.
 *
 * Usage:
 *   npm run benchmark:smoke
 *   BASE_URL=http://staging:4000 npm run benchmark:smoke
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import autocannon from "autocannon";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const thresholds = JSON.parse(fs.readFileSync(path.join(here, "thresholds.json"), "utf8"));

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
const startServer = !process.env.BASE_URL;
const CONNECTIONS = Number(process.env.SMOKE_CONNECTIONS || 5);
const DURATION = Number(process.env.SMOKE_DURATION || 10);

const smokeEndpoints = [
  { name: "GET /health", method: "GET", path: "/health" },
  { name: "GET /api/jobs", method: "GET", path: "/api/jobs/" },
  {
    name: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs/",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Smoke test job",
      description: "Smoke test description for CI",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "web-dev",
      skills: ["react"],
    }),
  },
  { name: "GET /api/search", method: "GET", path: "/api/search/?q=smoke" },
];

async function waitForHealth(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE_URL}/health`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Server did not become healthy");
}

async function main() {
  let server = null;
  if (startServer) {
    server = spawn("node", ["apps/api/src/server.js"], {
      cwd: ROOT,
      env: { ...process.env, PORT: "4000", JWT_SECRET: "benchmark-secret-not-for-production", BENCHMARK_MODE: "1" },
      stdio: "ignore",
    });
    await waitForHealth();
  }

  try {
    let failed = false;
    for (const ep of smokeEndpoints) {
      const res = await autocannon({
        url: BASE_URL + ep.path,
        method: ep.method,
        headers: ep.headers,
        body: ep.body,
        connections: CONNECTIONS,
        duration: DURATION,
        title: `smoke ${ep.name}`,
      });
      const p99 = res.latency?.p99 ?? Infinity;
      const limit = thresholds[ep.name] ?? thresholds.default;
      const ok = p99 <= limit;
      console.log(`${ok ? "PASS" : "FAIL"} ${ep.name}: p99=${p99}ms (threshold ${limit}ms)`);
      if (!ok) failed = true;
    }
    if (failed) {
      console.error("Smoke benchmark FAILED: p99 exceeded threshold.");
      process.exit(1);
    }
    console.log("Smoke benchmark passed.");
  } finally {
    if (server) server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("Smoke benchmark error:", err.message);
  process.exit(1);
});
