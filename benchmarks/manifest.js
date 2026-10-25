'use strict';

/**
 * Route manifest for the platform API benchmark suite.
 *
 * Every mounted `/api/*` route is enumerated here with:
 *   method  - HTTP method
 *   path    - route template (':id' placeholders are resolved by `resolve`)
 *   auth    - true when the route requires bearer auth
 *   payload - realistic production-shaped body (or null for GET)
 *   resolve - optional fn(params) returning concrete path params
 *
 * Maintain this file when routes change. The runner uses it to drive
 * autocannon against each endpoint.
 */

const jobsId = (p) => p.jobs = { id: '507f1f77bcf86cd799439011' };

module.exports = [
  // ---- health / auth ----
  { name: 'GET /health', method: 'GET', path: '/health', auth: false },
  { name: 'POST /api/auth/register', method: 'POST', path: '/api/auth/register', auth: false,
    payload: { name: 'Bench User', email: `bench+${Date.now()}@example.com`, password: 'BenchPass123!' } },
  { name: 'POST /api/auth/login', method: 'POST', path: '/api/auth/login', auth: false,
    payload: { email: 'bench@example.com', password: 'BenchPass123!' } },

  // ---- users ----
  { name: 'GET /api/users/me', method: 'GET', path: '/api/users/me', auth: true },

  // ---- jobs ----
  { name: 'GET /api/jobs', method: 'GET', path: '/api/jobs', auth: true },
  { name: 'POST /api/jobs', method: 'POST', path: '/api/jobs', auth: true,
    payload: { title: 'Benchmark job posting', description: 'A realistic benchmark payload from production schema.', budgetMin: 300, budgetMax: 800,
               categoryId: '507f1f77bcf86cd799439011', skills: ['node', 'api'] } },
  { name: 'GET /api/jobs/:id', method: 'GET', path: '/api/jobs/:id', auth: true, resolve: jobsId },

  // ---- proposals ----
  { name: 'GET /api/proposals', method: 'GET', path: '/api/proposals', auth: true },
  { name: 'POST /api/proposals', method: 'POST', path: '/api/proposals', auth: true,
    payload: { jobId: '507f1f77bcf86cd799439011', coverLetter: 'I can deliver this quickly.', amount: 480 } },

  // ---- payments ----
  { name: 'GET /api/payments', method: 'GET', path: '/api/payments', auth: true },
  { name: 'POST /api/payments', method: 'POST', path: '/api/payments', auth: true,
    payload: { amount: 100, currency: 'usd', method: 'card', description: 'benchmark' } },

  // ---- reviews ----
  { name: 'GET /api/reviews', method: 'GET', path: '/api/reviews', auth: true },
  { name: 'POST /api/reviews', method: 'POST', path: '/api/reviews', auth: true,
    payload: { jobId: '507f1f77bcf86cd799439011', rating: 5, comment: 'Great benchmark work.' } },

  // ---- messages ----
  { name: 'GET /api/messages', method: 'GET', path: '/api/messages', auth: true },
  { name: 'POST /api/messages', method: 'POST', path: '/api/messages', auth: true,
    payload: { recipientId: '507f1f77bcf86cd799439012', body: 'Hello from the benchmark.' } },

  // ---- notifications ----
  { name: 'GET /api/notifications', method: 'GET', path: '/api/notifications', auth: true },
  { name: 'POST /api/notifications', method: 'POST', path: '/api/notifications', auth: true,
    payload: { type: 'info', title: 'bench', body: 'notification payload' } },

  // ---- uploads (multipart) ----
  { name: 'POST /api/uploads', method: 'POST', path: '/api/uploads', auth: true,
    multipart: true, payload: { field: 'file', filename: 'bench.txt', content: 'benchmark upload body' } },

  // ---- search ----
  { name: 'GET /api/search', method: 'GET', path: '/api/search?q=benchmark', auth: false },

  // ---- admin ----
  { name: 'GET /api/admin/stats', method: 'GET', path: '/api/admin/stats', auth: true },
];