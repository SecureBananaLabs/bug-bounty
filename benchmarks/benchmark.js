import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';

const autocannonConfig = {
  url: process.env.BENCHMARK_URL || 'http://localhost:3000',
  connections: parseInt(process.env.BENCHMARK_CONNECTIONS) || 10,
  pipelining: parseInt(process.env.BENCHMARK_PIPELINING) || 10,
  timeout: parseInt(process.env.BENCHMARK_TIMEOUT) || 10,
  duration: parseInt(process.env.BENCHMARK_DURATION) || 30,
  amount: parseInt(process.env.BENCHMARK_AMOUNT) || 10000,
};

const endpoints = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/users',
  '/api/jobs',
  '/api/proposals',
  '/api/payments',
  '/api/reviews',
  '/api/messages',
  '/api/notifications',
  '/api/uploads',
  '/api/search',
  '/api/admin',
  '/health'
];

async function runBenchmark() {
  const results = [];

  for (const endpoint of endpoints) {
    const url = `${autocannonConfig.url}${endpoint}`;
    console.log(`Benchmarking ${url}`);
    
    const result = await autocannon({ 
      url,
      connections: autocannonConfig.connections,
      pipelining: autocannonConfig.pipelining,
      timeout: autocannonConfig.timeout,
      duration: autocannonConfig.duration,
      amount: autocannonConfig.amount,
    });

    results.push({
      endpoint,
      ...result
    });
  }

  return results;
}

async function main() {
  try {
    const results = await runBenchmark();
    console.log('Benchmarking complete');
    console.log(results);
  } catch (error) {
    console.error('Benchmark failed:', error);
  }
}

main();