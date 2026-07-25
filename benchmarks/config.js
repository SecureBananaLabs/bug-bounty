// Benchmark configuration - defines endpoints and test profiles
const TARGET = process.env.BENCHMARK_HOST || 'http://localhost:3000';

const ENDPOINTS = [
  { path: '/api/auth/login',    method: 'POST',   weight: 2,  body: { email: 'test@example.com', password: 'password123' } },
  { path: '/api/auth/register', method: 'POST',   weight: 1,  body: { email: 'new@example.com', password: 'password123', role: 'freelancer' } },
  { path: '/api/users',         method: 'GET',    weight: 3 },
  { path: '/api/jobs',          method: 'GET',    weight: 5 },
  { path: '/api/jobs',          method: 'POST',   weight: 2,  body: { title: 'Test Job', description: 'A test job description for benchmarking', budgetMin: 100, budgetMax: 500, categoryId: 'cat1' } },
  { path: '/api/proposals',     method: 'GET',    weight: 2 },
  { path: '/api/payments',      method: 'POST',   weight: 1,  body: { amount: 50, currency: 'usd' } },
  { path: '/api/reviews',       method: 'GET',    weight: 2 },
  { path: '/api/messages',      method: 'GET',    weight: 2 },
  { path: '/api/notifications', method: 'GET',    weight: 2 },
  { path: '/api/search',        method: 'GET',    weight: 1,  params: { q: 'developer' } },
  { path: '/api/admin',         method: 'GET',    weight: 1 },
  { path: '/health',            method: 'GET',    weight: 5 },
];

const PROFILES = {
  smoke:  { connections: 2,   duration: 5,  title: 'Smoke Test (2 conn, 5s)' },
  light:  { connections: 10,  duration: 10, title: 'Light Load (10 conn, 10s)' },
  medium: { connections: 50,  duration: 20, title: 'Medium Load (50 conn, 20s)' },
  heavy:  { connections: 100, duration: 30, title: 'Heavy Load (100 conn, 30s)' },
};

module.exports = { TARGET, ENDPOINTS, PROFILES };
