import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configuration
dotenv.config({ path: path.join(__dirname, '../.env.benchmark') });

const PORT = process.env.PORT || 4000;
const TARGET_URL = process.env.TARGET_URL || `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

// Parse command line arguments
const args = process.argv.slice(2);
const isSmoke = args.includes('--smoke');

console.log('========================================================');
console.log(`🚀 Sovereign Performance Benchmark Suite Initialized`);
console.log(`   Target URL:  ${TARGET_URL}`);
console.log(`   Mode:        ${isSmoke ? 'SMOKE TEST (CI REGRESSION GATE)' : 'FULL LOAD TEST'}`);
console.log('========================================================\n');

// 1. Generate dedicated benchmark test token (admin privileges to hit metrics)
const testToken = jwt.sign(
  { sub: 'usr_benchmark_test', role: 'admin', email: 'benchmark@example.com' },
  JWT_SECRET,
  { expiresIn: '1h' }
);
const authHeaders = { 'Authorization': `Bearer ${testToken}` };

// Setup mock upload payload
const boundary = '---BenchmarkBoundary';
const uploadBody = [
  `--${boundary}`,
  'Content-Disposition: form-data; name="file"; filename="test.txt"',
  'Content-Type: text/plain',
  '',
  'This is a test benchmark file content. Simulated load.',
  `--${boundary}--`,
  ''
].join('\r\n');

// Define all platform endpoints to benchmark
const endpoints = [
  {
    name: 'Health Check',
    path: '/health',
    method: 'GET',
    headers: {}
  },
  {
    name: 'User Register',
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: () => JSON.stringify({
      email: `benchmark_${Math.floor(Math.random() * 1000000)}@example.com`,
      password: 'securepassword123',
      role: 'client'
    })
  },
  {
    name: 'User Login',
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: () => JSON.stringify({
      email: 'benchmark_login@example.com',
      password: 'securepassword123'
    })
  },
  {
    name: 'Token Refresh',
    path: '/api/auth/refresh',
    method: 'POST',
    headers: {}
  },
  {
    name: 'OAuth Callback',
    path: '/api/auth/oauth/github/callback',
    method: 'GET',
    headers: {}
  },
  {
    name: 'Get Users List',
    path: '/api/users',
    method: 'GET',
    headers: {}
  },
  {
    name: 'Create User',
    path: '/api/users',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: () => JSON.stringify({
      email: `user_${Math.floor(Math.random() * 1000000)}@example.com`,
      role: 'freelancer'
    })
  },
  {
    name: 'Get Jobs List',
    path: '/api/jobs',
    method: 'GET',
    headers: {}
  },
  {
    name: 'Create Job Listing',
    path: '/api/jobs',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: () => JSON.stringify({
      title: `Senior JavaScript Developer - ${Math.floor(Math.random() * 1000)}`,
      description: 'Looking for a JS/TS expert to build premium high-fidelity benchmarking suites.',
      budgetMin: 500,
      budgetMax: 2500,
      categoryId: 'dev',
      skills: ['javascript', 'node', 'autocannon']
    })
  },
  {
    name: 'Get Proposals',
    path: '/api/proposals',
    method: 'GET',
    headers: {}
  },
  {
    name: 'Create Proposal',
    path: '/api/proposals',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: () => JSON.stringify({
      jobId: 'job_bounty_30',
      bid: 750,
      coverLetter: 'I am an autonomous agent that can solve this bounty in minutes. Highly professional.'
    })
  },
  {
    name: 'Create Payment Intent',
    path: '/api/payments',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: () => JSON.stringify({
      amount: 75000,
      currency: 'usd'
    })
  },
  {
    name: 'Get Reviews',
    path: '/api/reviews',
    method: 'GET',
    headers: {}
  },
  {
    name: 'Create Review',
    path: '/api/reviews',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: () => JSON.stringify({
      rating: 5,
      comment: 'Absolutely superb developer! Clean, fast, and secure code delivered.'
    })
  },
  {
    name: 'Get Messages List',
    path: '/api/messages',
    method: 'GET',
    headers: {}
  },
  {
    name: 'Send Message',
    path: '/api/messages',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: () => JSON.stringify({
      recipientId: 'usr_freelance_flow',
      content: 'Can you please review the autocannon benchmark suite?'
    })
  },
  {
    name: 'Get Notifications',
    path: '/api/notifications',
    method: 'GET',
    headers: {}
  },
  {
    name: 'Create Notification',
    path: '/api/notifications',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: () => JSON.stringify({
      type: 'bounty_won',
      message: 'Congratulations! Your PR for bounty #30 has been successfully merged.'
    })
  },
  {
    name: 'Global Search',
    path: '/api/search?q=autocannon',
    method: 'GET',
    headers: {}
  },
  {
    name: 'Multipart File Upload',
    path: '/api/uploads',
    method: 'POST',
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    body: () => uploadBody
  },
  {
    name: 'Admin Metrics (Auth Required)',
    path: '/api/admin/metrics',
    method: 'GET',
    headers: { ...authHeaders }
  }
];

// Precision measure for Time to First Byte (TTFB)
function measureTTFB(url, method, headers, bodyContent) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const start = process.hrtime.bigint();
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method || 'GET',
      headers: headers || {}
    };

    const req = http.request(options, (res) => {
      // res.on('readable') is triggered when there is data ready to be read
      res.on('readable', () => {
        const end = process.hrtime.bigint();
        const ttfb = Number(end - start) / 1e6; // Convert nanoseconds to milliseconds
        res.resume(); // Flush stream
        resolve(ttfb);
      });
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const ttfb = Number(end - start) / 1e6;
        resolve(ttfb);
      });
    });

    req.on('error', () => {
      resolve(0);
    });

    if (bodyContent) {
      req.write(bodyContent);
    }
    req.end();
  });
}

// Load threshold limits
let thresholds = { default: 200 };
try {
  const threshPath = path.join(__dirname, 'thresholds.json');
  if (fs.existsSync(threshPath)) {
    thresholds = JSON.parse(fs.readFileSync(threshPath, 'utf8'));
  }
} catch (err) {
  console.log(`⚠️  Could not load thresholds.json, using default fallback (200ms).`);
}

async function runSuite() {
  const results = {};
  const concurrency = isSmoke ? 2 : 20;
  const duration = isSmoke ? 1 : 3; // 1 second for smoke test, 3 seconds for full load

  let failedGate = false;
  const metricsList = [];

  for (const ep of endpoints) {
    const epUrl = `${TARGET_URL}${ep.path}`;
    console.log(`⏱️  Benchmarking: ${ep.name} [${ep.method} ${ep.path}]...`);

    // Prepare body if it's dynamic
    const bodyVal = ep.body ? ep.body() : undefined;

    // Measure TTFB
    const ttfb = await measureTTFB(epUrl, ep.method, ep.headers, bodyVal);

    // Run autocannon
    const opt = {
      url: epUrl,
      connections: concurrency,
      duration: duration,
      method: ep.method,
      headers: ep.headers,
      body: bodyVal
    };

    try {
      const runResult = await autocannon(opt);
      
      const sent = runResult.requests.sent || 1;
      const errors = runResult.errors || 0;
      const non2xx = runResult.non2xx || 0;
      const errorRate = ((errors + non2xx) / sent) * 100;

      // Extract latency statistics
      const p50 = runResult.latency.p50 || 0;
      const p95 = runResult.latency.p95 || 0;
      const p99 = runResult.latency.p99 || 0;
      const rps = runResult.requests.average || 0;

      // Check thresholds (strictly checking p99 latency)
      const limit = thresholds[ep.path] || thresholds.default;
      const isOk = p99 <= limit;

      if (isSmoke && !isOk) {
        failedGate = true;
      }

      const metric = {
        name: ep.name,
        path: ep.path,
        method: ep.method,
        p50,
        p95,
        p99,
        rps,
        errorRate: parseFloat(errorRate.toFixed(2)),
        ttfb: parseFloat(ttfb.toFixed(2)),
        threshold: limit,
        status: isOk ? 'PASSED' : 'FAILED'
      };

      metricsList.push(metric);
      results[ep.path] = metric;

      console.log(`   ↳ p50: ${p50}ms | p99: ${p99}ms | RPS: ${rps.toFixed(1)} | TTFB: ${ttfb.toFixed(2)}ms | Errors: ${metric.errorRate}% [${metric.status}]`);
    } catch (err) {
      console.error(`🔴 Error benchmarking ${ep.path}:`, err.message);
    }
  }

  // Create results directory
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Write JSON output
  fs.writeFileSync(
    path.join(resultsDir, 'results.json'),
    JSON.stringify(metricsList, null, 2),
    'utf8'
  );

  // Compile gorgeous Markdown summary
  let md = `# 📊 API Performance Benchmark Summary\n\n`;
  md += `This report compiles real-time, sandbox-derived performance diagnostics for the Freelance Flow API server.\n\n`;
  md += `### 🛠️ Execution Context\n`;
  md += `- **Date/Time:** \`${new Date().toISOString()}\`\n`;
  md += `- **Concurrency (Simulated Clients):** \`${concurrency}\`\n`;
  md += `- **Target Host:** \`${TARGET_URL}\`\n`;
  md += `- **Execution Mode:** \`${isSmoke ? 'Smoke Concurrency (CI Gate)' : 'Standard Performance Benchmark'}\`\n\n`;

  md += `### 📈 Performance Metrics Ledger\n\n`;
  md += `| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | Avg RPS | Error Rate (%) | TTFB (ms) | Threshold | Status |\n`;
  md += `| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

  for (const m of metricsList) {
    const statusIcon = m.status === 'PASSED' ? '🟢' : '🔴';
    md += `| **${m.name}** \`${m.path}\` | \`${m.method}\` | ${m.p50} | ${m.p95} | **${m.p99}** | ${m.rps.toFixed(1)} | ${m.errorRate}% | ${m.ttfb} | ${m.threshold}ms | ${statusIcon} **${m.status}** |\n`;
  }

  md += `\n*Threshold evaluations are performed against the p99 latency metric to track extreme outliers and regressions.*\n`;

  fs.writeFileSync(path.join(resultsDir, 'summary.md'), md, 'utf8');
  console.log(`\n💾 Benchmark reports compiled and saved under /benchmarks/results/`);

  if (isSmoke && failedGate) {
    console.log(`\n🚨 [SMOKE FAILURE] One or more endpoints failed the p99 regression gate thresholds!`);
    process.exit(1);
  } else {
    console.log(`\n🎉 [COMPLETE] Benchmark suite finished successfully.`);
    process.exit(0);
  }
}

runSuite();
