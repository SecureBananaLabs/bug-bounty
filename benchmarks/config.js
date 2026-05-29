/**
 * Benchmark Configuration for FreelanceFlow API
 * 
 * Configure which endpoints to test, test parameters, and baseline expectations.
 * All endpoints listed here should exist in the app's route definitions.
 */

const BASE_URL = process.env.BENCHMARK_URL || 'http://localhost:3001';

const TEST_TOKEN = process.env.BENCHMARK_TOKEN || 'benchmark-test-token';

const endpoints = [
  // Auth endpoints
  { method: 'POST', path: '/api/register', label: 'POST /api/register', body: { email: 'bench@test.com', password: 'password123', role: 'freelancer' } },
  { method: 'POST', path: '/api/login', label: 'POST /api/login', body: { email: 'bench@test.com', password: 'password123' } },
  { method: 'POST', path: '/api/refresh', label: 'POST /api/refresh', auth: true, body: {} },
  
  // Users endpoints
  { method: 'GET', path: '/api/users', label: 'GET /api/users', auth: true },
  { method: 'GET', path: '/api/users/bench_user', label: 'GET /api/users/:id', auth: true },
  { method: 'PATCH', path: '/api/users/bench_user', label: 'PATCH /api/users/:id', auth: true, body: { name: 'Benchmark User' } },
  
  // Jobs endpoints
  { method: 'GET', path: '/api/jobs', label: 'GET /api/jobs' },
  { method: 'GET', path: '/api/jobs/bench_job', label: 'GET /api/jobs/:id' },
  { method: 'POST', path: '/api/jobs', label: 'POST /api/jobs', auth: true, body: { title: 'Bench Job', description: 'Test', budget: 100, category: 'dev' } },
  { method: 'PATCH', path: '/api/jobs/bench_job', label: 'PATCH /api/jobs/:id', auth: true, body: { title: 'Updated' } },
  { method: 'DELETE', path: '/api/jobs/bench_job', label: 'DELETE /api/jobs/:id', auth: true },
  
  // Proposals
  { method: 'GET', path: '/api/proposals', label: 'GET /api/proposals', auth: true },
  { method: 'POST', path: '/api/proposals', label: 'POST /api/proposals', auth: true, body: { jobId: 'bench_job', coverLetter: 'I can do this', bid: 50 } },
  
  // Payments
  { method: 'POST', path: '/api/payments/create-intent', label: 'POST /api/payments', auth: true, body: { amount: 100, currency: 'usd' } },
  
  // Reviews
  { method: 'GET', path: '/api/reviews', label: 'GET /api/reviews' },
  { method: 'POST', path: '/api/reviews', label: 'POST /api/reviews', auth: true, body: { userId: 'bench_user', rating: 5, comment: 'Great' } },
  
  // Messages
  { method: 'GET', path: '/api/messages', label: 'GET /api/messages', auth: true },
  { method: 'POST', path: '/api/messages', label: 'POST /api/messages', auth: true, body: { receiverId: 'other_user', content: 'Hello' } },
  
  // Notifications
  { method: 'GET', path: '/api/notifications', label: 'GET /api/notifications', auth: true },
  
  // Search
  { method: 'GET', path: '/api/search?q=developer', label: 'GET /api/search' },
  
  // Admin
  { method: 'GET', path: '/api/admin/metrics', label: 'GET /api/admin/metrics', auth: true },
];

module.exports = { BASE_URL, TEST_TOKEN, endpoints };
