// Benchmark script using autocannon
const autocannon = require('autocannon');

const config = {
  url: process.env.TARGET_URL || 'http://localhost:3000',
  connections: parseInt(process.env.CONNECTIONS) || 10,
  duration: parseInt(process.env.DURATION) || 10,
  amount: parseInt(process.env.AMOUNT) || 0
};

const endpoints = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/users',
  '/api/jobs',
  '/api/proposals',
  '/api/payments',
  '/api/reviews',
  '/api/messages',
  '/api/notifications',
  '/api/search',
  '/api/admin'
];

const tests = endpoints.map(endpoint => ({
  title: `Benchmarking ${endpoint}`,
  url: `${config.url}${endpoint}`,
  method: 'POST',
  requests: 1000,
  maxConnectionRequests: config.connections,
  maxOverallDuration: config.duration
}));

const results = [];

async function runBenchmark() {
  for (const test of tests) {
    const result = await autocannon(test);
    results.push(result);
  }
  return results;
}

module.exports = runBenchmark;