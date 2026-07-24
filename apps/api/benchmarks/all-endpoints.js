// API Benchmark Suite — All Endpoints
// Usage: k6 run benchmarks/all-endpoints.js
// Uses realistic payload sizes drawn from production schema

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const latencyP50 = new Trend('latency_p50');
const latencyP95 = new Trend('latency_p95');
const latencyP99 = new Trend('latency_p99');
const ttfbTrend = new Trend('ttfb');

export const options = {
  stages: [
    { duration: '10s', target: 5 },   // ramp up
    { duration: '30s', target: 10 },  // steady
    { duration: '10s', target: 0 },   // ramp down
  ],
  thresholds: {
    errors: ['rate<0.05'],  // < 5% errors
    http_req_duration: ['p(95)<2000'],  // 95% under 2s
  },
};

const BASE_URL = __ENV.TARGET_HOST || 'http://localhost:3000';
const TOKEN = __ENV.BENCHMARK_TOKEN || 'benchmark-test-token';

const params = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
  },
};

// Realistic payloads
const userPayload = JSON.stringify({
  email: `benchmark-${Date.now()}@test.local`,
  password: 'BenchmarkTest123!',
  name: 'Benchmark User',
});

const jobPayload = JSON.stringify({
  title: 'Benchmark Job - API Performance Test',
  description: 'A'.repeat(200),
  budget: 100,
  category: 'development',
});

const proposalPayload = JSON.stringify({
  coverLetter: 'B'.repeat(300),
  proposedAmount: 95,
  estimatedDuration: 7,
});

const messagePayload = JSON.stringify({
  content: 'C'.repeat(100),
  receiverId: 'benchmark-receiver',
});

export default function () {
  // Track per-request metrics
  const responses = [];

  group('Health Check', function () {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'health status 200': (r) => r.status === 200 });
    recordMetrics(res, 'GET /health');
    errorRate.add(res.status !== 200);
  });

  group('Auth Routes', function () {
    // POST /api/auth/register
    const reg = http.post(`${BASE_URL}/api/auth/register`, userPayload, params);
    check(reg, { 'register status 200/201': (r) => r.status === 200 || r.status === 201 });
    recordMetrics(reg, 'POST /api/auth/register');
    errorRate.add(reg.status >= 400);

    // POST /api/auth/login
    const login = http.post(`${BASE_URL}/api/auth/login`, userPayload, params);
    check(login, { 'login status 200': (r) => r.status === 200 });
    recordMetrics(login, 'POST /api/auth/login');
    errorRate.add(login.status >= 400);
  });

  group('User Routes', function () {
    const users = http.get(`${BASE_URL}/api/users`, params);
    check(users, { 'list users status 200': (r) => r.status === 200 });
    recordMetrics(users, 'GET /api/users');
    errorRate.add(users.status >= 400);
  });

  group('Job Routes', function () {
    // POST /api/jobs
    const create = http.post(`${BASE_URL}/api/jobs`, jobPayload, params);
    check(create, { 'create job status 200/201': (r) => r.status === 200 || r.status === 201 });
    recordMetrics(create, 'POST /api/jobs');
    errorRate.add(create.status >= 400);

    // GET /api/jobs
    const list = http.get(`${BASE_URL}/api/jobs`, params);
    check(list, { 'list jobs status 200': (r) => r.status === 200 });
    recordMetrics(list, 'GET /api/jobs');
    errorRate.add(list.status >= 400);
  });

  group('Proposal Routes', function () {
    const proposals = http.post(`${BASE_URL}/api/proposals`, proposalPayload, params);
    check(proposals, { 'create proposal status 200/201': (r) => r.status === 200 || r.status === 201 });
    recordMetrics(proposals, 'POST /api/proposals');
    errorRate.add(proposals.status >= 400);
  });

  group('Payment Routes', function () {
    const payments = http.get(`${BASE_URL}/api/payments`, params);
    check(payments, { 'list payments status 200': (r) => r.status === 200 });
    recordMetrics(payments, 'GET /api/payments');
    errorRate.add(payments.status >= 400);
  });

  group('Review Routes', function () {
    const reviews = http.get(`${BASE_URL}/api/reviews`, params);
    check(reviews, { 'list reviews status 200': (r) => r.status === 200 });
    recordMetrics(reviews, 'GET /api/reviews');
    errorRate.add(reviews.status >= 400);
  });

  group('Message Routes', function () {
    const msg = http.post(`${BASE_URL}/api/messages`, messagePayload, params);
    check(msg, { 'send message status 200/201': (r) => r.status === 200 || r.status === 201 });
    recordMetrics(msg, 'POST /api/messages');
    errorRate.add(msg.status >= 400);
  });

  group('Notification Routes', function () {
    const notif = http.get(`${BASE_URL}/api/notifications`, params);
    check(notif, { 'list notifications status 200': (r) => r.status === 200 });
    recordMetrics(notif, 'GET /api/notifications');
    errorRate.add(notif.status >= 400);
  });

  group('Search Routes', function () {
    const search = http.get(`${BASE_URL}/api/search?q=benchmark&limit=10`, params);
    check(search, { 'search status 200': (r) => r.status === 200 });
    recordMetrics(search, 'GET /api/search');
    errorRate.add(search.status >= 400);
  });

  group('Admin Routes', function () {
    const admin = http.get(`${BASE_URL}/api/admin/stats`, params);
    check(admin, { 'admin stats status 200': (r) => r.status === 200 });
    recordMetrics(admin, 'GET /api/admin/stats');
    errorRate.add(admin.status >= 400);
  });

  sleep(1);
}

function recordMetrics(res, name) {
  // Record latency distribution metrics
  latencyP50.add(res.timings.duration);
  latencyP95.add(res.timings.duration);
  latencyP99.add(res.timings.duration);
  ttfbTrend.add(res.timings.waiting);

  // Log individual results at verbose levels
  console.log(`${name}: status=${res.status} duration=${res.timings.duration}ms ttfb=${res.timings.waiting}ms`);
}
