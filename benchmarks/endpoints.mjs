/**
 * Endpoint definitions for the benchmark suite.
 *
 * Every route under /api/ should be listed here. Payloads are drawn from the
 * production schema so that request sizes are realistic.
 *
 * `path` may contain `:param` placeholders. `params` supplies concrete values
 * used when building the request URL.
 */

export const endpoints = [
  {
    name: 'GET /api/health',
    method: 'GET',
    path: '/api/health',
    auth: false,
  },
  {
    name: 'GET /api/users',
    method: 'GET',
    path: '/api/users',
    auth: true,
  },
  {
    name: 'GET /api/users/:id',
    method: 'GET',
    path: '/api/users/:id',
    params: { id: '00000000-0000-0000-0000-000000000001' },
    auth: true,
  },
  {
    name: 'POST /api/users',
    method: 'POST',
    path: '/api/users',
    auth: true,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'benchmark.user@example.com',
      username: 'benchmark_user',
      displayName: 'Benchmark User',
      password: 'Str0ng-Benchmark-Passw0rd!',
      role: 'researcher',
    }),
  },
  {
    name: 'GET /api/bounties',
    method: 'GET',
    path: '/api/bounties',
    auth: true,
  },
  {
    name: 'GET /api/bounties/:id',
    method: 'GET',
    path: '/api/bounties/:id',
    params: { id: '00000000-0000-0000-0000-000000000002' },
    auth: true,
  },
  {
    name: 'POST /api/bounties',
    method: 'POST',
    path: '/api/bounties',
    auth: true,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Benchmark bounty',
      description:
        'A realistic-length description used to exercise the create-bounty path with production-like payload sizes.',
      severity: 'high',
      reward: 1500,
      scope: ['https://example.com'],
      tags: ['benchmark', 'api', 'performance'],
    }),
  },
  {
    name: 'GET /api/reports',
    method: 'GET',
    path: '/api/reports',
    auth: true,
  },
  {
    name: 'POST /api/reports',
    method: 'POST',
    path: '/api/reports',
    auth: true,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      bountyId: '00000000-0000-0000-0000-000000000002',
      title: 'Benchmark report',
      summary:
        'Summary of a realistic vulnerability report used for benchmarking the report submission endpoint.',
      severity: 'high',
      stepsToReproduce:
        '1. Navigate to the target.\n2. Send the crafted request.\n3. Observe the response.',
      impact:
        'An attacker could potentially escalate privileges or access data they should not be able to reach.',
    }),
  },
];

/**
 * Build a concrete URL path from an endpoint definition.
 * @param {{ path: string, params?: Record<string, string> }} endpoint
 * @returns {string}
 */
export function buildPath(endpoint) {
  let path = endpoint.path;
  if (endpoint.params) {
    for (const [key, value] of Object.entries(endpoint.params)) {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    }
  }
  return path;
}
