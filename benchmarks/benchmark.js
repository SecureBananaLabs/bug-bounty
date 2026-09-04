import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const p50Trend = new Trend('p50_latency');
const p95Trend = new Trend('p95_latency');
const p99Trend = new Trend('p99_latency');
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const endpoints = [
  { method: 'GET', path: '/api/health', name: 'Health Check' },
  { method: 'GET', path: '/api/users', name: 'List Users' },
  { method: 'POST', path: '/api/users', name: 'Create User', body: JSON.stringify({name: 'test'}) },
  { method: 'GET', path: '/api/products', name: 'List Products' },
  { method: 'GET', path: '/api/orders', name: 'List Orders' },
];

export default function () {
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const url = `${BASE_URL}${endpoint.path}`;
  const params = { headers: { 'Content-Type': 'application/json' } };

  const start = Date.now();
  let res;
  
  switch (endpoint.method) {
    case 'GET': res = http.get(url, params); break;
    case 'POST': res = http.post(url, endpoint.body || '', params); break;
    default: res = http.get(url, params);
  }

  const latency = Date.now() - start;
  p50Trend.add(latency);
  p95Trend.add(latency);
  p99Trend.add(latency);

  const passed = check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!passed);
  sleep(1);
}
