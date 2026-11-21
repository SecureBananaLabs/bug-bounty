import { createApp } from '../app.js';
import { setup } from 'node_modules/autocannon';

export async function runBenchmarks() {
  const app = createApp();
  const server = app.listen(3000);

  const autocannon = (await import('autocannon')).default;

  try {
    await setupBenchmarks(autocannon, server);
  } catch (error) {
    console.error('Error running benchmarks:', error);
    process.exit(1);
  }

  async function setupBenchmarks(autocannon, server) {
    const endpoints = [
      '/api/auth',
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

    for (const endpoint of endpoints) {
      const results = await autocannon({
        url: 'http://localhost:3000',
        method: 'POST',
        connections: 10,
        pipelining: 10,
        timeout: 10
      });
    }
  }
}