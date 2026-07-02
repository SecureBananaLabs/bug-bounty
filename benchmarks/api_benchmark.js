import http from 'k6/http';
import { check, sleep, SharedArray } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom Metrics
let errorRate = new Rate('errors');
let p50Latency = new Trend('p50_latency');
let p95Latency = new Trend('p95_latency');
let p99Latency = new Trend('p99_latency');
let ttfb = new Trend('ttfb');
let rps = new Counter('requests_total');

// Konfiguration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const DURATION = __ENV.DURATION || '30s';
const VUS = parseInt(__ENV.VUS) || 5;

// Token holen
let token = AUTH_TOKEN;
if (!token) {
    let loginRes = http.post(`${BASE_URL}/api/auth/login`, {
        email: __ENV.TEST_EMAIL || 'bench@test.com',
        password: __ENV.TEST_PASSWORD || 'benchmark123!'
    });
    if (loginRes.status === 200) {
        token = loginRes.json('token') || loginRes.json('accessToken') || '';
        console.log(`Token erhalten: ${token.substring(0, 20)}...`);
    } else {
        console.log(`Login fehlgeschlagen: ${loginRes.status} – Benchmarks laufen ohne Token`);
    }
}

const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

export const options = {
    stages: [
        { duration: '10s', target: VUS },
        { duration: DURATION, target: VUS },
        { duration: '5s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(50)<500', 'p(95)<2000', 'p(99)<5000'],
        http_req_failed: ['rate<0.05'],
    },
};

export default function () {

    // 1. GET /health
    let res0 = http.get(`${BASE_URL}/health`, { headers: { ...authHeaders } });
    check(res0, { 'status /health < 500': (r) => r.status < 500 });
    errorRate.add(res0.status >= 500);
    p50Latency.add(res0.timings.duration);
    p95Latency.add(res0.timings.duration);
    p99Latency.add(res0.timings.duration);
    ttfb.add(res0.timings.waiting);
    rps.add(1);
    sleep(0.1);

    // 2. GET /api/users/
    let res1 = http.get(`${BASE_URL}/api/users/`, { headers: { ...authHeaders } });
    check(res1, { 'status /api/users/ < 500': (r) => r.status < 500 });
    errorRate.add(res1.status >= 500);
    p50Latency.add(res1.timings.duration);
    p95Latency.add(res1.timings.duration);
    p99Latency.add(res1.timings.duration);
    ttfb.add(res1.timings.waiting);
    rps.add(1);
    sleep(0.1);

    // 3. GET /api/jobs/
    let res2 = http.get(`${BASE_URL}/api/jobs/`, { headers: { ...authHeaders } });
    check(res2, { 'status /api/jobs/ < 500': (r) => r.status < 500 });
    errorRate.add(res2.status >= 500);
    p50Latency.add(res2.timings.duration);
    p95Latency.add(res2.timings.duration);
    p99Latency.add(res2.timings.duration);
    ttfb.add(res2.timings.waiting);
    rps.add(1);
    sleep(0.1);

    // 4. GET /api/proposals/
    let res3 = http.get(`${BASE_URL}/api/proposals/`, { headers: { ...authHeaders } });
    check(res3, { 'status /api/proposals/ < 500': (r) => r.status < 500 });
    errorRate.add(res3.status >= 500);
    p50Latency.add(res3.timings.duration);
    p95Latency.add(res3.timings.duration);
    p99Latency.add(res3.timings.duration);
    ttfb.add(res3.timings.waiting);
    rps.add(1);
    sleep(0.1);

    // 5. GET /api/reviews/
    let res4 = http.get(`${BASE_URL}/api/reviews/`, { headers: { ...authHeaders } });
    check(res4, { 'status /api/reviews/ < 500': (r) => r.status < 500 });
    errorRate.add(res4.status >= 500);
    p50Latency.add(res4.timings.duration);
    p95Latency.add(res4.timings.duration);
    p99Latency.add(res4.timings.duration);
    ttfb.add(res4.timings.waiting);
    rps.add(1);
    sleep(0.1);

    // 6. GET /api/messages/
    let res5 = http.get(`${BASE_URL}/api/messages/`, { headers: { ...authHeaders } });
    check(res5, { 'status /api/messages/ < 500': (r) => r.status < 500 });
    errorRate.add(res5.status >= 500);
    p50Latency.add(res5.timings.duration);
    p95Latency.add(res5.timings.duration);
    p99Latency.add(res5.timings.duration);
    ttfb.add(res5.timings.waiting);
    rps.add(1);
    sleep(0.1);

    // 7. GET /api/notifications/
    let res6 = http.get(`${BASE_URL}/api/notifications/`, { headers: { ...authHeaders } });
    check(res6, { 'status /api/notifications/ < 500': (r) => r.status < 500 });
    errorRate.add(res6.status >= 500);
    p50Latency.add(res6.timings.duration);
    p95Latency.add(res6.timings.duration);
    p99Latency.add(res6.timings.duration);
    ttfb.add(res6.timings.waiting);
    rps.add(1);
    sleep(0.1);

    // 8. GET /api/search/
    let res7 = http.get(`${BASE_URL}/api/search/`, { headers: { ...authHeaders } });
    check(res7, { 'status /api/search/ < 500': (r) => r.status < 500 });
    errorRate.add(res7.status >= 500);
    p50Latency.add(res7.timings.duration);
    p95Latency.add(res7.timings.duration);
    p99Latency.add(res7.timings.duration);
    ttfb.add(res7.timings.waiting);
    rps.add(1);
    sleep(0.1);

    // 9. GET /api/admin/metrics
    let res8 = http.get(`${BASE_URL}/api/admin/metrics`, { headers: { ...authHeaders } });
    check(res8, { 'status /api/admin/metrics < 500': (r) => r.status < 500 });
    errorRate.add(res8.status >= 500);
    p50Latency.add(res8.timings.duration);
    p95Latency.add(res8.timings.duration);
    p99Latency.add(res8.timings.duration);
    ttfb.add(res8.timings.waiting);
    rps.add(1);
    sleep(0.1);

    // 10. GET /api/auth/oauth/:provider/callback
    let res9 = http.get(`${BASE_URL}/api/auth/oauth/:provider/callback`, { headers: { ...authHeaders } });
    check(res9, { 'status /api/auth/oauth/:provider/callback < 500': (r) => r.status < 500 });
    errorRate.add(res9.status >= 500);
    p50Latency.add(res9.timings.duration);
    p95Latency.add(res9.timings.duration);
    p99Latency.add(res9.timings.duration);
    ttfb.add(res9.timings.waiting);
    rps.add(1);
    sleep(0.1);

    // 11. POST /api/auth/register
    let res10 = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({"email": "bench@test.com", "password": "benchmark123!", "role": "client"}), { headers: { 'Content-Type': 'application/json', ...authHeaders } });
    check(res10, { 'status /api/auth/register < 500': (r) => r.status < 500 });
    errorRate.add(res10.status >= 500);
    rps.add(1);
    sleep(0.1);

    // 12. POST /api/auth/login
    let res11 = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({"email": "test@test.com", "password": "test1234"}), { headers: { 'Content-Type': 'application/json', ...authHeaders } });
    check(res11, { 'status /api/auth/login < 500': (r) => r.status < 500 });
    errorRate.add(res11.status >= 500);
    rps.add(1);
    sleep(0.1);

    // 13. POST /api/auth/refresh (leer)
    let res12 = http.post(`${BASE_URL}/api/auth/refresh`, null, { headers: { ...authHeaders } });
    check(res12, { 'status /api/auth/refresh < 500': (r) => r.status < 500 });
    rps.add(1);
    sleep(0.1);

    // 14. POST /api/users/
    let res13 = http.post(`${BASE_URL}/api/users/`, JSON.stringify({"email": "u@test.com", "name": "BenchUser", "role": "client"}), { headers: { 'Content-Type': 'application/json', ...authHeaders } });
    check(res13, { 'status /api/users/ < 500': (r) => r.status < 500 });
    errorRate.add(res13.status >= 500);
    rps.add(1);
    sleep(0.1);

    // 15. POST /api/jobs/
    let res14 = http.post(`${BASE_URL}/api/jobs/`, JSON.stringify({"title": "Benchmark Test Job", "description": "Benchmark test job description with enough chars", "budgetMin": 100, "budgetMax": 500, "categoryId": "cat-001", "skills": ["javascript", "node"]}), { headers: { 'Content-Type': 'application/json', ...authHeaders } });
    check(res14, { 'status /api/jobs/ < 500': (r) => r.status < 500 });
    errorRate.add(res14.status >= 500);
    rps.add(1);
    sleep(0.1);

    // 16. POST /api/proposals/ (leer)
    let res15 = http.post(`${BASE_URL}/api/proposals/`, null, { headers: { ...authHeaders } });
    check(res15, { 'status /api/proposals/ < 500': (r) => r.status < 500 });
    rps.add(1);
    sleep(0.1);

    // 17. POST /api/reviews/ (leer)
    let res16 = http.post(`${BASE_URL}/api/reviews/`, null, { headers: { ...authHeaders } });
    check(res16, { 'status /api/reviews/ < 500': (r) => r.status < 500 });
    rps.add(1);
    sleep(0.1);

    // 18. POST /api/messages/ (leer)
    let res17 = http.post(`${BASE_URL}/api/messages/`, null, { headers: { ...authHeaders } });
    check(res17, { 'status /api/messages/ < 500': (r) => r.status < 500 });
    rps.add(1);
    sleep(0.1);

    // 19. POST /api/notifications/ (leer)
    let res18 = http.post(`${BASE_URL}/api/notifications/`, null, { headers: { ...authHeaders } });
    check(res18, { 'status /api/notifications/ < 500': (r) => r.status < 500 });
    rps.add(1);
    sleep(0.1);

    // 20. POST /api/uploads/ (leer)
    let res19 = http.post(`${BASE_URL}/api/uploads/`, null, { headers: { ...authHeaders } });
    check(res19, { 'status /api/uploads/ < 500': (r) => r.status < 500 });
    rps.add(1);
    sleep(0.1);

    sleep(1);
}

export function handleSummary(data) {
    let summary = `## Benchmark Ergebnisse\n\n`;
    summary += `| Metrik | Wert |\n|--------|------|\n`;
    summary += `| Dauer | ${data.state.testRunDurationMs / 1000}s |\n`;
    summary += `| VUs | ${data.state.testRunDurationMs ? 'siehe Run' : 'n/a'} |\n`;
    summary += `| HTTP Fehlerrate | ${(data.metrics.http_req_failed?.values?.rate * 100 || 0).toFixed(2)}% |\n`;
    summary += `| p50 Latency | ${Math.round(data.metrics.http_req_duration?.['p(50)'] || 0)} ms |\n`;
    summary += `| p95 Latency | ${Math.round(data.metrics.http_req_duration?.['p(95)'] || 0)} ms |\n`;
    summary += `| p99 Latency | ${Math.round(data.metrics.http_req_duration?.['p(99)'] || 0)} ms |\n`;
    summary += `| TTFB (p50) | ${Math.round(data.metrics.ttfb?.['p(50)'] || 0)} ms |\n`;
    summary += `| requests_total | ${data.metrics.requests_total?.values?.count || 0} |\n`;
    
    console.log(summary);
    return { 'stdout': summary };
}
