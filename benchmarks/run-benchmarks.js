import autocannon from "autocannon";
import fs from "node:fs/promises";
import path from "node:path";

const root = new URL("..", import.meta.url);
const endpoints = JSON.parse(await fs.readFile(new URL("endpoints.json", import.meta.url), "utf8"));
const thresholds = JSON.parse(await fs.readFile(new URL("thresholds.json", import.meta.url), "utf8"));
const baseUrl = process.env.BENCHMARK_BASE_URL || "http://localhost:3000";
const smoke = process.argv.includes("--smoke");
const connections = Number(process.env.BENCHMARK_CONNECTIONS || (smoke ? thresholds.smokeConcurrency : 10));
const duration = Number(process.env.BENCHMARK_DURATION || (smoke ? thresholds.smokeDurationSeconds : 10));
const token = process.env.BENCHMARK_TOKEN;
const resultsDir = new URL("results/", import.meta.url);
await fs.mkdir(resultsDir, {recursive: true});

const rows = [];
for (const endpoint of endpoints) {
  const headers = {"content-type": "application/json"};
  if (endpoint.auth && token) headers.authorization = `Bearer ${token}`;
  const result = await autocannon({
    url: new URL(endpoint.path, baseUrl).toString(),
    method: endpoint.method,
    headers,
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
    connections,
    duration
  });
  const row = {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    p50: result.latency.p50,
    p95: result.latency.p95 ?? 0,
    p99: result.latency.p99 ?? 0,
    rpsAverage: result.requests.average,
    rpsMax: result.requests.max,
    errorRate: result.requests.total ? Number(((result.errors / result.requests.total) * 100).toFixed(2)) : 0,
    ttfbAverage: result.latency.average ?? 0
  };
  rows.push(row);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
await fs.writeFile(new URL(`${stamp}.json`, resultsDir), JSON.stringify(rows, null, 2));
const table = [
  "| Endpoint | p50 ms | p95 ms | p99 ms | avg RPS | max RPS | error % | avg TTFB ms |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ...rows.map(r => `| ${r.method} ${r.path} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.rpsAverage} | ${r.rpsMax} | ${r.errorRate} | ${r.ttfbAverage} |`)
].join("\n");
await fs.writeFile(new URL(`${stamp}.md`, resultsDir), `# API Benchmark Summary\n\nBase URL: ${baseUrl}\nConnections: ${connections}\nDuration: ${duration}s\n\n${table}\n`);

const failures = rows.filter(r => r.p99 > thresholds.defaultP99Ms);
if (smoke && failures.length) {
  console.error(`Smoke benchmark failed: p99 over ${thresholds.defaultP99Ms}ms for ${failures.map(f => f.name).join(", ")}`);
  process.exit(1);
}
console.log(table);
