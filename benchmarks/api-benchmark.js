import autocannon from "autocannon";

const baseUrl = process.env.BENCHMARK_BASE_URL ?? "http://localhost:4000";
const token = process.env.BENCHMARK_TOKEN ?? "";
const connections = Number(process.env.BENCHMARK_CONNECTIONS ?? 10);
const duration = Number(process.env.BENCHMARK_DURATION ?? 10);

const endpoints = [
  { name: "health", path: "/health" },
  { name: "jobs", path: "/api/jobs" },
  { name: "users", path: "/api/users" },
  { name: "search", path: "/api/search?q=designer" },
  { name: "admin-metrics", path: "/api/admin/metrics", auth: true }
];

function summarize(name, result) {
  return {
    endpoint: name,
    url: result.url,
    requests: {
      average: result.requests.average,
      total: result.requests.total
    },
    latency: {
      p50: result.latency.p50,
      p95: result.latency.p95,
      p99: result.latency.p99,
      average: result.latency.average
    },
    throughput: {
      average: result.throughput.average
    },
    errors: result.errors,
    timeouts: result.timeouts,
    non2xx: result.non2xx
  };
}

async function runEndpoint(endpoint) {
  const headers = endpoint.auth && token ? { authorization: `Bearer ${token}` } : undefined;
  const result = await autocannon({
    url: new URL(endpoint.path, baseUrl).toString(),
    connections,
    duration,
    headers
  });
  return summarize(endpoint.name, result);
}

const results = [];
for (const endpoint of endpoints) {
  // eslint-disable-next-line no-console
  console.log(`Benchmarking ${endpoint.name}...`);
  results.push(await runEndpoint(endpoint));
}

// eslint-disable-next-line no-console
console.log(JSON.stringify({ baseUrl, connections, duration, results }, null, 2));
