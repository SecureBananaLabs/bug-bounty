import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

// ─────────────────────────────────────────────────────────────
// CONFIGURATION (override via --env or environment variables)
// ─────────────────────────────────────────────────────────────
const TARGET_HOST = __ENV.TARGET_HOST || 'http://localhost:3000';
const AUTH_TOKEN  = __ENV.AUTH_TOKEN  || '';

// ─────────────────────────────────────────────────────────────
// CUSTOM METRICS
// ─────────────────────────────────────────────────────────────
const httpReqDurationP50 = new Trend('http_req_duration_p50');
const httpReqDurationP95 = new Trend('http_req_duration_p95');
const httpReqDurationP99 = new Trend('http_req_duration_p99');
const ttfbTrend           = new Trend('ttfb');
const errorRate            = new Rate('error_rate');
const totalRequests        = new Counter('total_requests');

// ─────────────────────────────────────────────────────────────
// REALISTIC PAYLOADS
// ─────────────────────────────────────────────────────────────
const PAYLOADS = {
  register: () => ({
    email: `bench-${randomString(6)}@test.com`,
    password: randomString(12),
    name: `BenchUser ${randomString(4)}`,
    role: 'freelancer',
  }),
  login: () => ({
    email: `bench-${randomString(6)}@test.com`,
    password: randomString(12),
  }),
  job: () => ({
    title: `Benchmark Job - ${randomString(8)}`,
    description: 'This is a realistic benchmark job description with sufficient length to simulate real payloads. It includes multiple sentences.',
    budget: randomIntBetween(100, 10000),
    category: ['web', 'mobile', 'data', 'devops', 'design'][randomIntBetween(0, 4)],
    skills: ['JavaScript', 'Python', 'React', 'Node.js'],
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }),
  proposal: () => ({
    jobId: `job_${randomIntBetween(1000, 9999)}`,
    coverLetter: `I am very interested in this project. I have ${randomIntBetween(2, 10)} years of experience.`,
    bidAmount: randomIntBetween(100, 5000),
    estimatedDays: randomIntBetween(1, 30),
  }),
  payment: () => ({
    amount: randomIntBetween(50, 5000),
    currency: 'USD',
    paymentMethod: 'card',
    description: `Payment for job completion - ref ${randomString(6)}`,
  }),
  review: () => ({
    targetUserId: `user_${randomIntBetween(100, 999)}`,
    jobId: `job_${randomIntBetween(1000, 9999)}`,
    rating: randomIntBetween(1, 5),
    comment: `Great work! Very professional. ${randomString(10)}`,
  }),
  message: () => ({
    recipientId: `user_${randomIntBetween(100, 999)}`,
    content: `Hello, I'm interested in working with you. ${randomString(20)}`,
    subject: `Proposal follow-up ${randomString(4)}`,
  }),
  notification: () => ({
    userId: `user_${randomIntBetween(100, 999)}`,
    type: ['message', 'proposal', 'payment', 'review'][randomIntBetween(0, 3)],
    title: `New notification ${randomString(4)}`,
    body: `You have a new activity on the platform. ${randomString(8)}`,
  }),
  userUpdate: () => ({
    name: `Updated User ${randomString(4)}`,
    bio: `Updated bio text ${randomString(15)}`,
    skills: ['React', 'TypeScript', 'Docker'],
  }),
};

// ─────────────────────────────────────────────────────────────
// HELPER: Make a request and record metrics
// ─────────────────────────────────────────────────────────────
function makeRequest(method, url, opts = {}) {
  totalRequests.add(1);

  const defaultHeaders = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) {
    defaultHeaders['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  const requestOpts = {
    headers: Object.assign(defaultHeaders, opts.headers || {}),
    tags: opts.tags || {},
    timeout: '30s',
  };

  if (opts.body) {
    requestOpts.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
  }

  const start = Date.now();
  let res;
  switch (method.toUpperCase()) {
    case 'GET':    res = http.get(url, requestOpts); break;
    case 'POST':   res = http.post(url, opts.body || '', requestOpts); break;
    case 'PUT':    res = http.put(url, opts.body || '', requestOpts); break;
    case 'DELETE': res = http.del(url, null, requestOpts); break;
    default:       res = http.get(url, requestOpts);
  }

  // Record TTFB (time to first byte)
  if (res.timings && res.timings.waiting) {
    ttfbTrend.add(res.timings.waiting);
  }

  // Record duration percentiles
  httpReqDurationP50.add(res.timings.duration);
  httpReqDurationP95.add(res.timings.duration);
  httpReqDurationP99.add(res.timings.duration);

  // Track errors
  const isError = res.status < 200 || res.status >= 400;
  errorRate.add(isError);

  return res;
}

// ─────────────────────────────────────────────────────────────
// HELPER: Check response
// ─────────────────────────────────────────────────────────────
function assertOK(res, label) {
  const ok = check(res, {
    [`${label} - status 2xx/3xx`]: (r) => r.status >= 200 && r.status < 400,
  });
  return ok;
}

// ─────────────────────────────────────────────────────────────
// REQUEST BODIES for multipart upload
// ─────────────────────────────────────────────────────────────
function buildFileUpload() {
  const fd = new FormData();
  // Create ~10KB of realistic file content
  const fileContent = new Array(200).fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit. ').join('');
  fd.append('file', http.file(fileContent, 'benchmark-test-file.txt', 'text/plain'));
  return fd.body();
}

// ─────────────────────────────────────────────────────────────
// K6 OPTIONS (overridable via env)
// ─────────────────────────────────────────────────────────────
export const options = {
  // Use __ENV to allow per-run overrides, with sensible defaults
  vus: parseInt(__ENV.VUS) || 20,
  duration: __ENV.DURATION || '60s',
  iterations: __ENV.ITERATIONS ? parseInt(__ENV.ITERATIONS) : undefined,

  thresholds: {
    // p95 latency must be under 200ms
    'http_req_duration_p95': ['p(95)<200'],
    // p99 latency must be under 500ms
    'http_req_duration_p99': ['p(99)<500'],
    // Error rate must be under 1%
    'error_rate': ['rate<0.01'],
  },

  summaryTrendStats: ['min', 'avg', 'med', 'p(50)', 'p(90)', 'p(95)', 'p(99)', 'max', 'count'],

  // Tags for filtering in the output
  tags: {
    benchmark: 'api-suite',
    repo: 'SecureBananaLabs/bug-bounty',
    issue: '#30',
  },
};

// ─────────────────────────────────────────────────────────────
// DEFAULT FUNCTION - Main test entry point
// ─────────────────────────────────────────────────────────────
export default function () {

  // ── HEALTH CHECK ──────────────────────────────────────────
  group('01 - Health Check', () => {
    const res = makeRequest('GET', `${TARGET_HOST}/health`);
    assertOK(res, 'Health check');
    sleep(0.1);
  });

  // ── AUTH ENDPOINTS ────────────────────────────────────────
  group('02 - Auth', () => {
    const registerRes = makeRequest('POST', `${TARGET_HOST}/api/auth/register`, {
      body: PAYLOADS.register(),
    });
    assertOK(registerRes, 'POST /api/auth/register');
    sleep(0.2);

    const loginRes = makeRequest('POST', `${TARGET_HOST}/api/auth/login`, {
      body: PAYLOADS.login(),
    });
    assertOK(loginRes, 'POST /api/auth/login');
    sleep(0.2);

    // OAuth callback (simulated - won't actually authenticate but tests route)
    const oauthRes = makeRequest('GET', `${TARGET_HOST}/api/auth/oauth/github/callback?code=test_code&state=test_state`);
    assertOK(oauthRes, 'GET /api/auth/oauth/:provider/callback');
    sleep(0.2);

    const refreshRes = makeRequest('POST', `${TARGET_HOST}/api/auth/refresh`, {
      body: { refreshToken: 'test-refresh-token-fake' },
    });
    assertOK(refreshRes, 'POST /api/auth/refresh');
    sleep(0.2);
  });

  // ── USERS ENDPOINTS ───────────────────────────────────────
  group('03 - Users', () => {
    const listRes = makeRequest('GET', `${TARGET_HOST}/api/users`);
    assertOK(listRes, 'GET /api/users');
    sleep(0.1);

    const createRes = makeRequest('POST', `${TARGET_HOST}/api/users`, {
      body: PAYLOADS.register(),
    });
    assertOK(createRes, 'POST /api/users');
    sleep(0.2);
  });

  // ── JOBS ENDPOINTS ────────────────────────────────────────
  group('04 - Jobs', () => {
    const listRes = makeRequest('GET', `${TARGET_HOST}/api/jobs`);
    assertOK(listRes, 'GET /api/jobs');
    sleep(0.1);

    const createRes = makeRequest('POST', `${TARGET_HOST}/api/jobs`, {
      body: PAYLOADS.job(),
    });
    assertOK(createRes, 'POST /api/jobs');
    sleep(0.2);
  });

  // ── PROPOSALS ENDPOINTS ───────────────────────────────────
  group('05 - Proposals', () => {
    const listRes = makeRequest('GET', `${TARGET_HOST}/api/proposals`);
    assertOK(listRes, 'GET /api/proposals');
    sleep(0.1);

    const createRes = makeRequest('POST', `${TARGET_HOST}/api/proposals`, {
      body: PAYLOADS.proposal(),
    });
    assertOK(createRes, 'POST /api/proposals');
    sleep(0.2);
  });

  // ── PAYMENTS ENDPOINTS ────────────────────────────────────
  group('06 - Payments', () => {
    const createRes = makeRequest('POST', `${TARGET_HOST}/api/payments`, {
      body: PAYLOADS.payment(),
    });
    assertOK(createRes, 'POST /api/payments');
    sleep(0.2);
  });

  // ── REVIEWS ENDPOINTS ─────────────────────────────────────
  group('07 - Reviews', () => {
    const listRes = makeRequest('GET', `${TARGET_HOST}/api/reviews`);
    assertOK(listRes, 'GET /api/reviews');
    sleep(0.1);

    const createRes = makeRequest('POST', `${TARGET_HOST}/api/reviews`, {
      body: PAYLOADS.review(),
    });
    assertOK(createRes, 'POST /api/reviews');
    sleep(0.2);
  });

  // ── MESSAGES ENDPOINTS ────────────────────────────────────
  group('08 - Messages', () => {
    const listRes = makeRequest('GET', `${TARGET_HOST}/api/messages`);
    assertOK(listRes, 'GET /api/messages');
    sleep(0.1);

    const createRes = makeRequest('POST', `${TARGET_HOST}/api/messages`, {
      body: PAYLOADS.message(),
    });
    assertOK(createRes, 'POST /api/messages');
    sleep(0.2);
  });

  // ── NOTIFICATIONS ENDPOINTS ───────────────────────────────
  group('09 - Notifications', () => {
    const listRes = makeRequest('GET', `${TARGET_HOST}/api/notifications`);
    assertOK(listRes, 'GET /api/notifications');
    sleep(0.1);

    const createRes = makeRequest('POST', `${TARGET_HOST}/api/notifications`, {
      body: PAYLOADS.notification(),
    });
    assertOK(createRes, 'POST /api/notifications');
    sleep(0.2);
  });

  // ── UPLOADS ENDPOINTS ─────────────────────────────────────
  group('10 - Uploads', () => {
    const uploadBody = buildFileUpload();
    const res = makeRequest('POST', `${TARGET_HOST}/api/uploads`, {
      body: uploadBody,
      headers: { 'Content-Type': 'multipart/form-data; boundary=----benchmarkboundary' },
    });
    assertOK(res, 'POST /api/uploads (multipart)');
    sleep(0.3);
  });

  // ── SEARCH ENDPOINTS ──────────────────────────────────────
  group('11 - Search', () => {
    const res = makeRequest('GET', `${TARGET_HOST}/api/search?q=react+developer&category=web&page=1&limit=10`);
    assertOK(res, 'GET /api/search');
    sleep(0.1);
  });

  // ── ADMIN ENDPOINTS (auth-protected) ──────────────────────
  group('12 - Admin', () => {
    const res = makeRequest('GET', `${TARGET_HOST}/api/admin/metrics`);
    // Admin route requires auth; if no token, 401 is expected
    if (AUTH_TOKEN) {
      assertOK(res, 'GET /api/admin/metrics (authenticated)');
    } else {
      check(res, {
        'GET /api/admin/metrics - 401 without token': (r) => r.status === 401,
      });
    }
    sleep(0.2);
  });
}

// ─────────────────────────────────────────────────────────────
// HANDLE SUMMARY - Output results in JSON format
// ─────────────────────────────────────────────────────────────
export function handleSummary(data) {
  const summary = {
    metadata: {
      benchmark: 'SecureBananaLabs/bug-bounty API Suite',
      issue: '#30',
      target: TARGET_HOST,
      timestamp: new Date().toISOString(),
      config: {
        vus: options.vus,
        duration: options.duration,
        iterations: options.iterations || null,
      },
    },
    thresholds: {
      passed: data.metrics
        ? Object.entries(data.metrics)
            .filter(([_, m]) => m.thresholds)
            .reduce((acc, [name, m]) => {
              acc[name] = Object.entries(m.thresholds).map(([t, v]) => ({
                threshold: t,
                ok: v.ok,
              }));
              return acc;
            }, {})
        : {},
    },
    metrics: {},
  };

  // Extract key metrics
  if (data.metrics) {
    const keys = [
      'http_req_duration',
      'http_req_duration_p95',
      'http_req_duration_p99',
      'ttfb',
      'error_rate',
      'total_requests',
      'http_reqs',
      'http_req_failed',
      'iterations',
      'vus',
    ];

    for (const key of keys) {
      if (data.metrics[key]) {
        const m = data.metrics[key];
        summary.metrics[key] = {
          type: m.type,
          values: m.values,
        };
        if (m.thresholds) {
          summary.metrics[key].thresholds = Object.entries(m.thresholds).map(([t, v]) => ({
            threshold: t,
            ok: v.ok,
          }));
        }
      }
    }
  }

  // Console-friendly summary
  console.log('\n========================================');
  console.log('  BENCHMARK RESULTS');
  console.log('========================================');
  console.log(`  Target:       ${TARGET_HOST}`);
  console.log(`  VUs:          ${options.vus}`);
  console.log(`  Duration:     ${options.duration}`);
  console.log('----------------------------------------');

  if (data.metrics) {
    const dur = data.metrics.http_req_duration;
    if (dur) {
      console.log(`  Avg Latency:  ${dur.values.avg.toFixed(2)} ms`);
      console.log(`  P50 Latency:  ${dur.values['p(50)'].toFixed(2)} ms`);
      console.log(`  P95 Latency:  ${dur.values['p(95)'].toFixed(2)} ms`);
      console.log(`  P99 Latency:  ${dur.values['p(99)'].toFixed(2)} ms`);
      console.log(`  Max Latency:  ${dur.values.max.toFixed(2)} ms`);
    }

    const reqs = data.metrics.http_reqs;
    if (reqs) {
      console.log(`  Total Reqs:   ${reqs.values.count}`);
      console.log(`  RPS:          ${reqs.values.rate.toFixed(2)}`);
    }

    const failed = data.metrics.http_req_failed;
    if (failed) {
      console.log(`  Failures:     ${(failed.values.rate * 100).toFixed(2)}%`);
    }
  }

  console.log('----------------------------------------');

  // Threshold status
  if (summary.thresholds.passed) {
    console.log('  THRESHOLDS:');
    for (const [key, threshArr] of Object.entries(summary.thresholds.passed)) {
      for (const t of threshArr) {
        const status = t.ok ? 'PASS' : 'FAIL';
        console.log(`    ${key}  ${t.threshold}  [${status}]`);
      }
    }
  }

  console.log('========================================\n');

  return {
    'stdout': '', // Already printed above
    'benchmark-summary.json': JSON.stringify(summary, null, 2),
  };
}
