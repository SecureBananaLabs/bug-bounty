#!/usr/bin/env node
/**
 * CI Smoke Benchmark Test
 *
 * Runs a low-concurrency benchmark and fails if p99 latency
 * exceeds thresholds defined in thresholds.json.
 *
 * Usage:
 *   node smoke-test.js
 *
 * Exit code 0 = all endpoints within thresholds
 * Exit code 1 = one or more endpoints exceeded thresholds
 */

import autocannon from "autocannon";
import { readFileSync } from "fs";

const HOST = process.env.BENCHMARK_HOST || "http://localhost:3000";
const CONNECTIONS = 2;
const DURATION = 5;

const thresholds = JSON.parse(readFileSync("./thresholds.json", "utf-8"));

const endpoints = [
  { name: "health", method: "GET", path: "/health" },
  { name: "auth_register", method: "POST", path: "/api/auth/register", body: JSON.stringify({ email: "smoke@test.com", password: "password123", name: "Smoke Test" }), headers: { "content-type": "application/json" } },
  { name: "auth_login", method: "POST", path: "/api/auth/login", body: JSON.stringify({ email: "smoke@test.com", password: "password123" }), headers: { "content-type": "application/json" } },
  { name: "users_list", method: "GET", path: "/api/users" },
  { name: "jobs_list", method: "GET", path: "/api/jobs" },
  { name: "proposals_list", method: "GET", path: "/api/proposals" },
  { name: "reviews_list", method: "GET", path: "/api/reviews" },
  { name: "messages_list", method: "GET", path: "/api/messages" },
  { name: "notifications_list", method: "GET", path: "/api/notifications" },
  { name: "search", method: "GET", path: "/api/search?q=test" },
];

async function runSmoke(endpoint) {
  const options = {
    url: `${HOST}${endpoint.path}`,
    method: endpoint.method,
    connections: CONNECTIONS,
    duration: DURATION,
    headers: endpoint.headers || {},
    body: endpoint.body,
  };

  return new Promise((resolve) => {
    autocannon(options, (err, result) => {
      if (err) {
        resolve({ name: endpoint.name, passed: false, reason: err.message });
        return;
      }

      const threshold = thresholds.endpoints[endpoint.name] || thresholds.default;
      const p99 = result.latency.p99;
      const errorRate = (result.errors / result.requests.total) * 100;

      const p99Pass = p99 <= threshold.p99_ms;
      const errorPass = errorRate <= threshold.error_rate_percent;

      resolve({
        name: endpoint.name,
        passed: p99Pass && errorPass,
        p99,
        p99Threshold: threshold.p99_ms,
        p99Pass,
        errorRate: errorRate.toFixed(2),
        errorThreshold: threshold.error_rate_percent,
        errorPass,
      });
    });
  });
}

async function main() {
  console.log("🔍 CI Smoke Benchmark Test");
  console.log(`Target: ${HOST} | Connections: ${CONNECTIONS} | Duration: ${DURATION}s\n`);

  let allPassed = true;
  for (const endpoint of endpoints) {
    const result = await runSmoke(endpoint);
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    const reason = result.reason
      ? ` (${result.reason})`
      : !result.passed
        ? ` (p99: ${result.p99}ms / threshold: ${result.p99Threshold}ms, errors: ${result.errorRate}% / threshold: ${result.errorThreshold}%)`
        : "";
    console.log(`  ${status} ${endpoint.name}${reason}`);
    if (!result.passed) allPassed = false;
  }

  console.log(`\n${allPassed ? "✅ All endpoints within thresholds" : "❌ Some endpoints exceeded thresholds"}`);
  process.exit(allPassed ? 0 : 1);
}

main();
