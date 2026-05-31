import autocannon from 'autocannon'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TARGET = process.env.BENCHMARK_TARGET || 'http://localhost:3001'
const TOKEN = process.env.BENCHMARK_TOKEN || ''
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || '10')
const DURATION = parseInt(process.env.BENCHMARK_DURATION || '30')

const RESULTS_DIR = path.join(__dirname, 'results')
const THRESHOLDS_PATH = path.join(__dirname, 'thresholds.json')

const thresholds = JSON.parse(fs.readFileSync(THRESHOLDS_PATH, 'utf-8'))

const headers = { 'Content-Type': 'application/json' }
if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`

function buildUrl(path) {
  return `${TARGET}${path}`
}

const endpoints = [
  // Auth
  { group: 'auth', name: 'register', method: 'POST', path: '/api/auth/register', body: { email: 'test@test.com', password: 'Test123!', name: 'Test User', role: 'freelancer' } },
  { group: 'auth', name: 'login', method: 'POST', path: '/api/auth/login', body: { email: 'test@test.com', password: 'Test123!' } },

  // Jobs
  { group: 'jobs', name: 'list', method: 'GET', path: '/api/jobs' },

  // Users
  { group: 'users', name: 'list', method: 'GET', path: '/api/users' },

  // Proposals
  { group: 'proposals', name: 'list', method: 'GET', path: '/api/proposals' },

  // Messages
  { group: 'messages', name: 'list', method: 'GET', path: '/api/messages' },

  // Payments
  { group: 'payments', name: 'list', method: 'GET', path: '/api/payments' },

  // Reviews
  { group: 'reviews', name: 'list', method: 'GET', path: '/api/reviews' },

  // Notifications
  { group: 'notifications', name: 'list', method: 'GET', path: '/api/notifications' },

  // Search
  { group: 'search', name: 'search', method: 'GET', path: '/api/search?q=test' },

  // Admin
  { group: 'admin', name: 'dashboard', method: 'GET', path: '/api/admin/dashboard' },
  { group: 'admin', name: 'users', method: 'GET', path: '/api/admin/users' },
]

async function runBenchmark(endpoint) {
  const opts = {
    url: buildUrl(endpoint.path),
    method: endpoint.method,
    connections: CONNECTIONS,
    duration: DURATION,
    headers,
    title: `${endpoint.group}/${endpoint.name}`,
  }
  if (endpoint.body) {
    opts.body = JSON.stringify(endpoint.body)
  }

  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

function extractMetrics(result) {
  return {
    latency: {
      p50: result.latency.p50,
      p95: result.latency.p95,
      p99: result.latency.p99,
    },
    requests: {
      average: result.requests.average,
      mean: result.requests.mean,
      stddev: result.requests.stddev,
      total: result.requests.total,
      sent: result.requests.sent,
    },
    throughput: {
      average: result.throughput.average,
      mean: result.throughput.mean,
      total: result.throughput.total,
    },
    errors: result.errors,
    timeouts: result.timeouts,
    rejects: result.rejects,
    duration: result.duration,
    non2xx: result.non2xx,
    '1xx': result['1xx'],
    '2xx': result['2xx'],
    '3xx': result['3xx'],
    '4xx': result['4xx'],
    '5xx': result['5xx'],
    statusCodes: result.statusCodes,
  }
}

function checkThresholds(endpoint, metrics) {
  const t = thresholds[endpoint.group]?.[endpoint.name]
  if (!t) return { passed: true, message: 'No threshold configured' }

  const failures = []
  if (metrics.latency.p99 > t.p99) failures.push(`p99 ${metrics.latency.p99}ms > ${t.p99}ms threshold`)
  if (metrics.latency.p95 > t.p95) failures.push(`p95 ${metrics.latency.p95}ms > ${t.p95}ms threshold`)
  const errorRate = ((metrics.errors + metrics.timeouts + metrics.rejects) / metrics.requests.total) * 100
  if (errorRate > t.errorRate) failures.push(`error rate ${errorRate.toFixed(2)}% > ${t.errorRate}% threshold`)

  return { passed: failures.length === 0, message: failures.join('; ') || 'All thresholds passed' }
}

async function runAll() {
  console.log(`Starting benchmark suite against ${TARGET}`)
  console.log(`Connections: ${CONNECTIONS}, Duration: ${DURATION}s`)
  console.log('')
  console.log('='.repeat(72))

  const allResults = {}
  const markdownRows = []
  const markdownHeader = '| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | Req/s | Throughput (MB/s) | Errors | Threshold |'
  const markdownSep = '|----------|--------|----------|----------|----------|-------|-------------------|--------|-----------|'

  for (const endpoint of endpoints) {
    const key = `${endpoint.group}/${endpoint.name}`
    console.log(`\nBenchmarking ${endpoint.method} ${endpoint.path}...`)

    try {
      const result = await runBenchmark(endpoint)
      const metrics = extractMetrics(result)
      const thresholdCheck = checkThresholds(endpoint, metrics)
      allResults[key] = {
        endpoint,
        metrics,
        threshold: thresholdCheck,
        raw: { requests: result.requests, latency: result.latency, throughput: result.throughput },
      }

      const reqPerSec = metrics.requests.average?.toFixed(1) || 'N/A'
      const throughputMB = (metrics.throughput.average / (1024 * 1024)).toFixed(2)
      const thresholdStatus = thresholdCheck.passed ? '✅ PASS' : `❌ FAIL (${thresholdCheck.message})`

      console.log(`  p50: ${metrics.latency.p50}ms | p95: ${metrics.latency.p95}ms | p99: ${metrics.latency.p99}ms`)
      console.log(`  Req/s: ${reqPerSec} | Throughput: ${throughputMB} MB/s | Errors: ${metrics.errors}`)
      console.log(`  Threshold: ${thresholdStatus}`)

      markdownRows.push(
        `| ${key} | ${endpoint.method} | ${metrics.latency.p50} | ${metrics.latency.p95} | ${metrics.latency.p99} | ${reqPerSec} | ${throughputMB} | ${metrics.errors} | ${thresholdStatus} |`
      )
    } catch (err) {
      console.error(`  FAILED: ${err.message}`)
      allResults[key] = { endpoint, error: err.message }
      markdownRows.push(`| ${key} | ${endpoint.method} | ERROR | ERROR | ERROR | ERROR | ERROR | ERROR | ❌ FAIL (${err.message}) |`)
    }

    // Small delay between endpoints
    await new Promise(r => setTimeout(r, 1000))
  }

  // Write JSON results
  const jsonPath = path.join(RESULTS_DIR, 'benchmark-results.json')
  fs.writeFileSync(jsonPath, JSON.stringify(allResults, null, 2))
  console.log(`\nJSON results written to ${jsonPath}`)

  // Write markdown summary
  const mdPath = path.join(RESULTS_DIR, 'benchmark-summary.md')
  const markdown = [
    '# API Benchmark Results',
    '',
    `**Date:** ${new Date().toISOString()}`,
    `**Target:** ${TARGET}`,
    `**Connections:** ${CONNECTIONS}`,
    `**Duration:** ${DURATION}s`,
    `**Tool:** autocannon`,
    '',
    '## Results Summary',
    '',
    markdownHeader,
    markdownSep,
    ...markdownRows,
    '',
    '## Regression Check',
    '',
    ...Object.entries(allResults)
      .filter(([_, v]) => v.threshold)
      .map(([key, v]) => `- **${key}**: ${v.threshold.passed ? '✅ PASS' : `❌ FAIL (${v.threshold.message})`}`),
    '',
    '---',
    '',
    '_Generated by benchmark runner_',
    '',
  ].join('\n')

  fs.writeFileSync(mdPath, markdown)
  console.log(`Markdown summary written to ${mdPath}`)

  // Check overall pass/fail
  const failures = Object.entries(allResults).filter(([_, v]) => v.threshold && !v.threshold.passed)
  if (failures.length > 0) {
    console.log(`\n⚠️  ${failures.length} endpoint(s) exceeded thresholds:`)
    failures.forEach(([k, v]) => console.log(`  - ${k}: ${v.threshold.message}`))
  } else {
    console.log('\n✅ All endpoints passed threshold checks!')
  }
}

runAll().catch(console.error)
