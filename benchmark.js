// API Benchmark Suite — k6 script
// Run: k6 run --vus 10 --duration 30s benchmark.js
//
// Environment variables:
//   BASE_URL  - API base URL (default: http://localhost:3000)
//   TOKEN     - Auth token for protected routes (optional)

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const rps = new Rate('requests_per_second');
const errorRate = new Rate('error_rate');
const p50 = new Trend('latency_p50');
const p95 = new Trend('latency_p95');
const p99 = new Trend('latency_p99');
const ttfb = new Trend('ttfb');
const totalRequests = new Counter('total_requests');
const successRequests = new Counter('success_requests');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.TOKEN || '';

export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Ramp up
    { duration: '20s', target: 10 },   // Steady
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% under 2s
    error_rate: ['rate<0.10'],           // <10% errors
  },
};

function recordMetrics(name, response) {
  const duration = response.timings.duration;
  p50.add(duration);
  p95.add(duration);
  p99.add(duration);
  ttfb.add(response.timings.waiting);
  totalRequests.add(1);
  rps.add(1);

  if (response.status >= 200 && response.status < 500) {
    successRequests.add(1);
  } else {
    errorRate.add(1);
  }
}

function authHeaders() {
  return AUTH_TOKEN
    ? { headers: { Authorization: `Bearer ${AUTH_TOKEN}`, 'Content-Type': 'application/json' } }
    : { headers: { 'Content-Type': 'application/json' } };
}

export default function () {
  // === Public Endpoints ===
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'health is 200': (r) => r.status === 200 });
    recordMetrics('health', res);
  });

  group('Auth - Register', () => {
    const payload = JSON.stringify({
      email: `benchmark_${Date.now()}@test.com`,
      password: 'Benchmark123!',
      name: 'Benchmark User',
    });
    const res = http.post(`${BASE_URL}/api/auth/register`, payload, authHeaders());
    check(res, { 'register is 200/201': (r) => r.status === 201 || r.status === 200 });
    recordMetrics('auth_register', res);
  });

  group('Auth - Login', () => {
    const payload = JSON.stringify({
      email: `benchmark_${Date.now()}@test.com`,
      password: 'Benchmark123!',
    });
    const res = http.post(`${BASE_URL}/api/auth/login`, payload, authHeaders());
    check(res, { 'login is 200': (r) => r.status === 200 });
    recordMetrics('auth_login', res);
  });

  group('Auth - Token Refresh', () => {
    const res = http.post(`${BASE_URL}/api/auth/refresh`, '{}', authHeaders());
    check(res, { 'refresh responded' : (r) => r.status >= 200 && r.status < 500 });
    recordMetrics('auth_refresh', res);
  });

  // === Read Endpoints (GET) ===
  group('Users - List', () => {
    const res = http.get(`${BASE_URL}/api/users`, authHeaders());
    check(res, { 'users list responded': (r) => r.status >= 200 && r.status < 500 });
    recordMetrics('users_list', res);
  });

  group('Jobs - List', () => {
    const res = http.get(`${BASE_URL}/api/jobs`, authHeaders());
    check(res, { 'jobs list responded': (r) => r.status >= 200 && r.status < 500 });
    recordMetrics('jobs_list', res);
  });

  group('Proposals - List', () => {
    const res = http.get(`${BASE_URL}/api/proposals`, authHeaders());
    check(res, { 'proposals list responded': (r) => r.status >= 200 && r.status < 500 });
    recordMetrics('proposals_list', res);
  });

  group('Reviews - List', () => {
    const res = http.get(`${BASE_URL}/api/reviews`, authHeaders());
    check(res, { 'reviews list responded': (r) => r.status >= 200 && r.status < 500 });
    recordMetrics('reviews_list', res);
  });

  group('Messages - List', () => {
    const res = http.get(`${BASE_URL}/api/messages`, authHeaders());
    check(res, { 'messages list responded': (r) => r.status >= 200 && r.status < 500 });
    recordMetrics('messages_list', res);
  });

  group('Notifications - List', () => {
    const res = http.get(`${BASE_URL}/api/notifications`, authHeaders());
    check(res, { 'notifications list responded': (r) => r.status >= 200 && r.status < 500 });
    recordMetrics('notifications_list', res);
  });

  group('Search', () => {
    const res = http.get(`${BASE_URL}/api/search?q=developer&limit=10`, authHeaders());
    check(res, { 'search responded': (r) => r.status >= 200 && r.status < 500 });
    recordMetrics('search', res);
  });

  // === Write Endpoints (POST) ===
  group('Jobs - Create', () => {
    const payload = JSON.stringify({
      title: 'Benchmark Job - Senior Developer',
      description: 'A test job created during API benchmarking to measure performance under load.',
      budget: 5000,
      category: 'Engineering',
      skills: ['TypeScript', 'React', 'Node.js'],
    });
    const res = http.post(`${BASE_URL}/api/jobs`, payload, authHeaders());
    check(res, { 'job creation responded': (r) => r.status >= 200 && r.status < 500 });
    recordMetrics('jobs_create', res);
  });

  group('Proposals - Create', () => {
    const payload = JSON.stringify({
      jobId: 'benchmark-job-id',
      coverLetter: 'I am an experienced developer interested in this position.',
      proposedRate: 100,
    });
    const res = http.post(`${BASE_URL}/api/proposals`, payload, authHeaders());
    check(res, { 'proposal creation responded': (r) => r.status >= 200 && r.status < 500 });
    recordMetrics('proposals_create', res);
  });

  group('Payments - Create', () => {
    const payload = JSON.stringify({
      amount: 1000,
      currency: 'USD',
      description: 'Benchmark payment',
    });
    const res = http.post(`${BASE_URL}/api/payments`, payload, authHeaders());
    check(res, { 'payment creation responded': (r) => r.status >= 200 && r.status < 500 });
    recordMetrics('payments_create', res);
  });

  group('Reviews - Create', () => {
    const payload = JSON.stringify({
      targetUserId: 'benchmark-user-id',
      rating: 5,
      comment: 'Excellent work!',
    });
    const res = http.post(`${BASE_URL}/api/reviews`, payload, authHeaders());
    check(res, { 'review creation responded': (r) => r.status >= 200 && r.status < 500 });
    recordMetrics('reviews_create', res);
  });

  group('Messages - Send', () => {
    const payload = JSON.stringify({
      recipientId: 'benchmark-recipient-id',
      subject: 'Benchmark Message',
      body: 'This is a test message generated during benchmarking.',
    });
    const res = http.post(`${BASE_URL}/api/messages`, payload, authHeaders());
    check(res, { 'message send responded': (r) => r.status >= 200 && r.status < 500 });
    recordMetrics('messages_send', res);
  });

  // === Admin Endpoints (Protected) ===
  if (AUTH_TOKEN) {
    group('Admin - Metrics', () => {
      const res = http.get(`${BASE_URL}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });
      check(res, { 'admin metrics responded': (r) => r.status >= 200 && r.status < 500 });
      recordMetrics('admin_metrics', res);
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: '  ', enableColors: true }),
    'benchmark-report.json': JSON.stringify(data, null, 2),
  };
}
