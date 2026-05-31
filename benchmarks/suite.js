import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up to 20 users
    { duration: '1m', target: 20 },  // stay at 20 users
    { duration: '30s', target: 0 },  // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(99)<500'], // 99% of requests should be below 500ms
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000/api';

export default function () {
  // 1. Health Check
  let res = http.get(`${BASE_URL}/health`);
  check(res, { 'status is 200': (r) => r.status === 200 });

  // 2. Auth - Login (Simulated payload)
  let loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'admin@benchmark.com',
    password: 'password123'
  }), { headers: { 'Content-Type': 'application/json' } });
  
  check(loginRes, { 'login success': (r) => r.status === 200 });
  let token = loginRes.json('token');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. Jobs - List
  let jobsRes = http.get(`${BASE_URL}/jobs`, { headers: authHeaders });
  check(jobsRes, { 'get jobs status 200': (r) => r.status === 200 });

  // 4. Notifications
  let notifRes = http.get(`${BASE_URL}/notifications`, { headers: authHeaders });
  check(notifRes, { 'get notifs status 200': (r) => r.status === 200 });

  // 5. Search
  let searchRes = http.get(`${BASE_URL}/search?q=developer`, { headers: authHeaders });
  check(searchRes, { 'search status 200': (r) => r.status === 200 });

  sleep(1);
}
