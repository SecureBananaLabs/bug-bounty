/**
 * FreelanceFlow API Benchmark Suite
 * 
 * 使用 autocannon 对所有 /api/ 端点进行性能基准测试
 * 测量 p50/p95/p99 延迟、RPS、错误率和 TTFB
 * 
 * 用法: node benchmarks/run.js
 * 单个端点: node benchmarks/run.js --endpoint health
 */

import autocannon from "autocannon";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BENCHMARK_URL || "http://localhost:3000";
const DURATION = process.env.BENCHMARK_DURATION || "10";
const CONNECTIONS = process.env.BENCHMARK_CONNECTIONS || "10";
const BENCHMARK_TOKEN = process.env.BENCHMARK_TOKEN || "";

// 基准测试端点配置
const endpoints = [
  // 公开端点（无需认证）
  {
    name: "health",
    method: "GET",
    path: "/health",
    expectStatus: 200,
  },
  {
    name: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    body: JSON.stringify({
      email: `bench_${Date.now()}@test.com`,
      password: "BenchTest123!",
      name: "Benchmark User",
      role: "client",
    }),
    headers: { "Content-Type": "application/json" },
    expectStatus: [201, 400, 409],
  },
  {
    name: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    body: JSON.stringify({
      email: "bench@test.com",
      password: "BenchTest123!",
    }),
    headers: { "Content-Type": "application/json" },
    expectStatus: [200, 401],
  },
  {
    name: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh",
    body: JSON.stringify({}),
    headers: { "Content-Type": "application/json" },
    expectStatus: [200, 401],
  },
  {
    name: "users-list",
    method: "GET",
    path: "/api/users",
    expectStatus: [200, 401],
  },
  {
    name: "users-create",
    method: "POST",
    path: "/api/users",
    body: JSON.stringify({
      email: `bench_user_${Date.now()}@test.com`,
      password: "BenchTest123!",
      name: "Benchmark Created User",
      role: "freelancer",
    }),
    headers: { "Content-Type": "application/json" },
    expectStatus: [201, 400, 401, 409],
  },
  {
    name: "jobs-list",
    method: "GET",
    path: "/api/jobs",
    expectStatus: [200, 401],
  },
  {
    name: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    body: JSON.stringify({
      title: "Benchmark Test Job",
      description: "Job created by benchmark suite",
      budget: 1000,
      category: "development",
      skills: ["javascript", "nodejs"],
    }),
    headers: { "Content-Type": "application/json" },
    expectStatus: [201, 400, 401],
  },
  {
    name: "proposals-list",
    method: "GET",
    path: "/api/proposals",
    expectStatus: [200, 401],
  },
  {
    name: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    body: JSON.stringify({
      jobId: "bench-job-id",
      coverLetter: "Benchmark proposal",
      bidAmount: 500,
      timeline: "7 days",
    }),
    headers: { "Content-Type": "application/json" },
    expectStatus: [201, 400, 401],
  },
  {
    name: "payments-create",
    method: "POST",
    path: "/api/payments",
    body: JSON.stringify({
      amount: 1000,
      currency: "usd",
      jobId: "bench-job-id",
    }),
    headers: { "Content-Type": "application/json" },
    expectStatus: [200, 400, 401],
  },
  {
    name: "reviews-list",
    method: "GET",
    path: "/api/reviews",
    expectStatus: [200, 401],
  },
  {
    name: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    body: JSON.stringify({
      revieweeId: "bench-user-id",
      rating: 5,
      comment: "Benchmark review",
    }),
    headers: { "Content-Type": "application/json" },
    expectStatus: [201, 400, 401],
  },
  {
    name: "messages-list",
    method: "GET",
    path: "/api/messages",
    expectStatus: [200, 401],
  },
  {
    name: "messages-create",
    method: "POST",
    path: "/api/messages",
    body: JSON.stringify({
      recipientId: "bench-user-id",
      content: "Benchmark message",
    }),
    headers: { "Content-Type": "application/json" },
    expectStatus: [201, 400, 401],
  },
  {
    name: "notifications-list",
    method: "GET",
    path: "/api/notifications",
    expectStatus: [200, 401],
  },
  {
    name: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    body: JSON.stringify({
      userId: "bench-user-id",
      type: "info",
      message: "Benchmark notification",
    }),
    headers: { "Content-Type": "application/json" },
    expectStatus: [201, 400, 401],
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search?q=benchmark",
    expectStatus: [200, 401],
  },
  {
    name: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    headers: BENCHMARK_TOKEN
      ? { Authorization: `Bearer ${BENCHMARK_TOKEN}` }
      : {},
    expectStatus: [200, 401],
  },
];

// 运行单个端点的基准测试
async function benchmarkEndpoint(config) {
  const authHeaders = BENCHMARK_TOKEN
    ? { Authorization: `Bearer ${BENCHMARK_TOKEN}` }
    : {};

  const options = {
    url: BASE_URL,
    duration: parseInt(DURATION),
    connections: parseInt(CONNECTIONS),
    method: config.method,
    path: config.path,
    headers: { ...authHeaders, ...(config.headers || {}) },
    body: config.body,
  };

  try {
    const result = await autocannon(options);
    return {
      name: config.name,
      method: config.method,
      path: config.path,
      latency: {
        p50: result.latency.p50,
        p95: result.latency.p95,
        p99: result.latency.p99,
        average: result.latency.average,
      },
      requests: {
        average: result.requests.average,
        mean: result.requests.mean,
        total: result.requests.total,
      },
      throughput: {
        average: result.throughput.average,
        mean: result.throughput.mean,
      },
      errors: result.errors,
      timeouts: result.timeouts,
      duration: result.duration,
      connections: result.connections,
    };
  } catch (err) {
    return {
      name: config.name,
      method: config.method,
      path: config.path,
      error: err.message,
    };
  }
}

// 格式化延迟（毫秒）
function fmtLatency(ns) {
  if (ns === null || ns === undefined) return "N/A";
  return `${(ns / 1000).toFixed(2)} ms`;
}

// 格式化 RPS
function fmtRPS(rps) {
  if (rps === null || rps === undefined) return "N/A";
  return `${rps.toFixed(1)} req/s`;
}

// 格式化吞吐量
function fmtThroughput(bytes) {
  if (bytes === null || bytes === undefined) return "N/A";
  if (bytes > 1048576) return `${(bytes / 1048576).toFixed(2)} MB/s`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(2)} KB/s`;
  return `${bytes.toFixed(0)} B/s`;
}

// 生成控制台报告
function printReport(results) {
  console.log("\n" + "=".repeat(80));
  console.log("  FreelanceFlow API Benchmark Report");
  console.log("  " + new Date().toISOString());
  console.log("  Target: " + BASE_URL);
  console.log("  Duration: " + DURATION + "s | Connections: " + CONNECTIONS);
  console.log("=".repeat(80) + "\n");

  // 表头
  const header =
    "Endpoint".padEnd(25) +
    "Method".padEnd(8) +
    "p50".padEnd(12) +
    "p95".padEnd(12) +
    "p99".padEnd(12) +
    "RPS".padEnd(14) +
    "Errors".padEnd(10) +
    "Throughput";
  console.log(header);
  console.log("-".repeat(header.length));

  for (const r of results) {
    if (r.error) {
      console.log(
        r.name.padEnd(25) +
          "ERROR: ".padEnd(8) +
          r.error,
      );
      continue;
    }

    const row =
      r.name.padEnd(25) +
      r.method.padEnd(8) +
      fmtLatency(r.latency.p50).padEnd(12) +
      fmtLatency(r.latency.p95).padEnd(12) +
      fmtLatency(r.latency.p99).padEnd(12) +
      fmtRPS(r.requests.average).padEnd(14) +
      String(r.errors).padEnd(10) +
      fmtThroughput(r.throughput.average);
    console.log(row);
  }

  console.log("\n" + "=".repeat(80));
  console.log("  Summary");
  console.log("=".repeat(80));

  const successful = results.filter((r) => !r.error);
  const avgP50 =
    successful.reduce((s, r) => s + r.latency.p50, 0) / successful.length;
  const avgP95 =
    successful.reduce((s, r) => s + r.latency.p95, 0) / successful.length;
  const avgP99 =
    successful.reduce((s, r) => s + r.latency.p99, 0) / successful.length;
  const totalErrors = successful.reduce((s, r) => s + r.errors, 0);
  const avgRPS =
    successful.reduce((s, r) => s + r.requests.average, 0) / successful.length;

  console.log(`  Endpoints tested: ${successful.length}/${results.length}`);
  console.log(`  Average p50 latency: ${fmtLatency(avgP50)}`);
  console.log(`  Average p95 latency: ${fmtLatency(avgP95)}`);
  console.log(`  Average p99 latency: ${fmtLatency(avgP99)}`);
  console.log(`  Average RPS: ${fmtRPS(avgRPS)}`);
  console.log(`  Total errors: ${totalErrors}`);
  console.log("");
}

// 生成 JSON 报告
function saveJsonReport(results) {
  const reportDir = join(__dirname, "reports");
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = join(reportDir, `benchmark-${timestamp}.json`);

  const report = {
    timestamp: new Date().toISOString(),
    config: {
      baseUrl: BASE_URL,
      duration: DURATION,
      connections: CONNECTIONS,
      authConfigured: !!BENCHMARK_TOKEN,
    },
    results,
  };

  writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`  Report saved: ${filename}`);
}

// 主函数
async function main() {
  const targetEndpoint = process.argv.find((a) => a.startsWith("--endpoint="));
  const targetName = targetEndpoint
    ? targetEndpoint.split("=")[1]
    : process.argv[process.argv.indexOf("--endpoint") + 1];

  let targets = endpoints;
  if (targetName) {
    targets = endpoints.filter((e) => e.name === targetName);
    if (targets.length === 0) {
      console.error(
        `Endpoint "${targetName}" not found. Available: ${endpoints.map((e) => e.name).join(", ")}`,
      );
      process.exit(1);
    }
  }

  console.log(
    `\nRunning benchmarks for ${targets.length} endpoint(s) against ${BASE_URL}...\n`,
  );

  const results = [];
  for (const endpoint of targets) {
    console.log(`  Benchmarking: ${endpoint.method} ${endpoint.path} ...`);
    const result = await benchmarkEndpoint(endpoint);
    results.push(result);
  }

  printReport(results);
  saveJsonReport(results);
}

main().catch(console.error);
