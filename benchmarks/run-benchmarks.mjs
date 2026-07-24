import { mkdir, readFile, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { benchmarkEndpoints } from "./endpoints.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const resultsDir = path.join(__dirname, "results")

export function calculateStats(samples) {
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b)
  const ttfbs = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b)
  const errors = samples.filter((sample) => !sample.ok).length

  return {
    requests: samples.length,
    errors,
    errorRate: roundPercent(errors, samples.length),
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
    p99TtfbMs: percentile(ttfbs, 99),
  }
}

export async function runEndpointBenchmark({
  baseUrl,
  endpoint,
  fetchImpl = fetch,
  authToken,
  defaultIterations = 5,
}) {
  const iterations = endpoint.iterations ?? defaultIterations
  const samples = []
  const startedAt = performance.now()

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const request = buildRequest(endpoint, iteration, authToken)
    const url = new URL(endpoint.path, baseUrl).toString()
    const start = performance.now()
    let status = 0
    let ok = false
    let ttfbMs = 0

    try {
      const response = await fetchImpl(url, request)
      ttfbMs = performance.now() - start
      status = response.status
      ok = response.ok
      await response.arrayBuffer()
    } catch {
      ttfbMs = performance.now() - start
    }

    samples.push({
      ok,
      status,
      latencyMs: performance.now() - start,
      ttfbMs,
    })
  }

  const durationSeconds = (performance.now() - startedAt) / 1000
  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    ...calculateStats(samples),
    rps: round(samples.length / Math.max(durationSeconds, 0.001), 2),
  }
}

export function buildMarkdownReport(report) {
  const rows = report.endpoints
    .map(
      (endpoint) =>
        `| ${endpoint.name} | ${endpoint.method} | ${endpoint.path} | ${endpoint.requests} | ${endpoint.errorRate}% | ${endpoint.p50Ms} | ${endpoint.p95Ms} | ${endpoint.p99Ms} | ${endpoint.p99TtfbMs} | ${endpoint.rps} |`,
    )
    .join("\n")

  return `# API Benchmark Summary

- Target: ${report.targetUrl}
- Started: ${report.startedAt}
- Finished: ${report.finishedAt}
- Endpoints covered: ${report.summary.endpoints}
- Total requests: ${report.summary.totalRequests}
- Total errors: ${report.summary.totalErrors}
- Max p99 latency: ${report.summary.maxP99Ms} ms
- Max p99 TTFB: ${report.summary.maxP99TtfbMs} ms

| Endpoint | Method | Path | Requests | Error rate | p50 ms | p95 ms | p99 ms | p99 TTFB ms | RPS |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`
}

export function evaluateThresholds({ report, thresholds }) {
  const maxErrorRate = Math.max(
    0,
    ...report.endpoints.map((endpoint) => endpoint.errorRate),
  )
  const failures = []

  if (report.summary.maxP99Ms > thresholds.maxP99Ms) {
    failures.push(
      `max p99 latency ${report.summary.maxP99Ms} ms exceeds threshold ${thresholds.maxP99Ms} ms`,
    )
  }
  if (maxErrorRate > thresholds.maxErrorRate) {
    failures.push(
      `max error rate ${maxErrorRate}% exceeds threshold ${thresholds.maxErrorRate}%`,
    )
  }

  return {
    ok: failures.length === 0,
    failures,
  }
}

export async function runBenchmarkSuite(options = {}) {
  const localServer = options.targetUrl
    ? null
    : await startLocalServer(options.port ?? 0)
  const targetUrl = options.targetUrl ?? localServer.url
  const authToken = options.authToken ?? localServer?.authToken
  const selectedEndpoints = options.smoke
    ? benchmarkEndpoints.filter((endpoint) =>
        ["/health", "/api/jobs", "/api/search?q=designer", "/api/admin/metrics"].includes(
          endpoint.path,
        ),
      )
    : benchmarkEndpoints

  const startedAt = new Date().toISOString()
  const endpoints = []
  try {
    for (const endpoint of selectedEndpoints) {
      endpoints.push(
        await runEndpointBenchmark({
          baseUrl: targetUrl,
          endpoint,
          authToken,
          defaultIterations: options.iterations ?? (options.smoke ? 2 : 5),
        }),
      )
    }
  } finally {
    await localServer?.close()
  }

  const finishedAt = new Date().toISOString()
  const report = {
    targetUrl,
    startedAt,
    finishedAt,
    mode: options.smoke ? "smoke" : "full",
    environment: getEnvironmentMetadata(),
    summary: summarize(endpoints),
    endpoints,
  }
  const thresholds = await loadThresholds(report.mode)
  report.thresholds = thresholds
  report.thresholdResult = evaluateThresholds({ report, thresholds })
  const markdown = buildMarkdownReport(report)

  await mkdir(resultsDir, { recursive: true })
  await writeFile(path.join(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`)
  await writeFile(path.join(resultsDir, "latest.md"), markdown)

  return report
}

function buildRequest(endpoint, iteration, authToken) {
  const headers = {}
  let body

  if (endpoint.auth && authToken) {
    headers.authorization = `Bearer ${authToken}`
  }

  if (endpoint.formData) {
    const form = new FormData()
    const fields = endpoint.formData(iteration)
    for (const [key, value] of Object.entries(fields)) {
      if (key === "file") {
        form.set(key, value, fields.filename ?? "benchmark.txt")
      } else if (key !== "filename") {
        form.set(key, value)
      }
    }
    body = form
  } else if (endpoint.body) {
    headers["content-type"] = "application/json"
    body = JSON.stringify(endpoint.body(iteration))
  }

  return {
    method: endpoint.method,
    headers,
    body,
  }
}

async function startLocalServer(port) {
  const [{ createApp }, { signAccessToken }] = await Promise.all([
    import("../apps/api/src/app.js"),
    import("../apps/api/src/utils/jwt.js"),
  ])
  const app = createApp()
  const server = app.listen(port, "127.0.0.1")

  await new Promise((resolve, reject) => {
    server.once("listening", resolve)
    server.once("error", reject)
  })

  const address = server.address()
  return {
    url: `http://127.0.0.1:${address.port}`,
    authToken: signAccessToken({ sub: "benchmark_admin", role: "admin" }),
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      }),
  }
}

function summarize(endpoints) {
  return {
    endpoints: endpoints.length,
    totalRequests: endpoints.reduce((sum, endpoint) => sum + endpoint.requests, 0),
    totalErrors: endpoints.reduce((sum, endpoint) => sum + endpoint.errors, 0),
    maxP99Ms: Math.max(...endpoints.map((endpoint) => endpoint.p99Ms)),
    maxP99TtfbMs: Math.max(...endpoints.map((endpoint) => endpoint.p99TtfbMs)),
  }
}

async function loadThresholds(mode) {
  const thresholdPath = path.join(__dirname, "thresholds.json")
  const thresholds = JSON.parse(await readFile(thresholdPath, "utf8"))
  return thresholds[mode]
}

function getEnvironmentMetadata() {
  return {
    cpu: os.cpus()[0]?.model ?? "unknown",
    cores: os.cpus().length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    node: process.version,
  }
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) return 0
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1
  return round(sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))])
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits))
}

function roundPercent(value, total) {
  if (total === 0) return 0
  return round((value / total) * 100, 2)
}

function parseArgs(argv) {
  const args = new Map()
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg.startsWith("--")) {
      const [key, inlineValue] = arg.slice(2).split("=")
      const value = inlineValue ?? (argv[index + 1]?.startsWith("--") ? true : argv[++index])
      args.set(key, value ?? true)
    }
  }
  return args
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2))
  const report = await runBenchmarkSuite({
    smoke: args.has("smoke"),
    targetUrl: args.get("target-url") || process.env.BENCHMARK_TARGET_URL,
    authToken: args.get("auth-token") || process.env.BENCHMARK_AUTH_TOKEN,
    iterations: args.has("iterations") ? Number(args.get("iterations")) : undefined,
  })
  console.log(buildMarkdownReport(report))
  if (!report.thresholdResult.ok) {
    console.error(report.thresholdResult.failures.join("\n"))
    process.exitCode = 1
  }
}
