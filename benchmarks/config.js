module.exports = {
  // Target server configuration
  server: process.env.BENCHMARK_SERVER || 'http://localhost:3000',
  
  // Default benchmark settings
  default: {
    connections: 10,
    duration: 10,
    timeout: 30,
  },
  
  // Endpoint-specific configurations
  endpoints: [
    {
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'benchmark@example.com',
        password: 'benchmark123',
      }),
      connections: 5,
      duration: 5,
    },
    {
      path: '/api/users/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.BENCHMARK_TOKEN}`,
      },
      connections: 10,
      duration: 10,
    },
    {
      path: '/api/jobs',
      method: 'GET',
      connections: 15,
      duration: 15,
    },
    {
      path: '/api/jobs',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BENCHMARK_TOKEN}`,
      },
      body: JSON.stringify({
        title: 'Benchmark Test Job',
        description: 'This is a test job for benchmarking',
        budget: 1000,
        category: 'development',
      }),
      connections: 5,
      duration: 5,
    },
    // Add more endpoints as needed
  ],
  
  // Performance thresholds for CI
  thresholds: {
    p99Latency: 500, // ms
    errorRate: 1, // percentage
  },
};