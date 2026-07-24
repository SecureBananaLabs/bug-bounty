import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Load test thresholds and endpoints
export const options = {
    vus: 50,
    duration: '30s',
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'], // 99% of requests must complete below 1s
        http_req_failed: ['rate<0.01'],                 // less than 1% errors
    },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const TOKEN = __ENV.BENCHMARK_TOKEN || 'test-benchmark-token';

const endpoints = [
    { method: 'GET', url: '/api/auth/health', auth: false },
    { method: 'POST', url: '/api/auth/login', auth: false, body: { email: 'test@https://scientific-highlighted-sustainable-safely.trycloudflare.com', password: 'password' } },
    { method: 'GET', url: '/api/jobs', auth: false },
    { method: 'GET', url: '/api/admin/metrics', auth: true },
    { method: 'POST', url: '/api/messages', auth: true, body: { text: "Hello", to: "user_123" } },
];

export default function () {
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Pick a random endpoint
    const idx = Math.floor(Math.random() * endpoints.length);
    const ep = endpoints[idx];

    if (ep.auth) {
        params.headers['Authorization'] = `Bearer ${TOKEN}`;
    }

    let res;
    if (ep.method === 'GET') {
        res = http.get(`${BASE_URL}${ep.url}`, params);
    } else {
        res = http.post(`${BASE_URL}${ep.url}`, JSON.stringify(ep.body), params);
    }

    check(res, {
        'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'TTFB < 300ms': (r) => r.timings.waiting < 300,
    });
    
    sleep(0.1);
}

export function handleSummary(data) {
    // Return markdown summary
    const md = `
# Benchmark Results
- **Total Requests**: ${data.metrics.http_reqs.values.count}
- **p50 Latency**: ${data.metrics.http_req_duration.values.p(50).toFixed(2)} ms
- **p95 Latency**: ${data.metrics.http_req_duration.values.p(95).toFixed(2)} ms
- **p99 Latency**: ${data.metrics.http_req_duration.values.p(99).toFixed(2)} ms
- **RPS**: ${data.metrics.http_reqs.values.rate.toFixed(2)}
- **Error Rate**: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
    `;
    return {
        "summary.md": md,
        "results.json": JSON.stringify(data),
    };
}
