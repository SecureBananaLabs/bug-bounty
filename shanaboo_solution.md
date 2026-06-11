 ```diff
--- /dev/null
+++ b/benchmarks/.env.benchmark
@@ -0,0 +1,12 @@
+# Benchmark Environment Configuration
+# Copy this file to .env.benchmark and fill in your values
+
+# Target server URL (required)
+# Examples: http://localhost:3000, https://staging.freelanceflow.io
+BENCHMARK_TARGET_URL=http://localhost:3000
+
+# Benchmark test token for auth-protected routes (required)
+# Create a dedicated benchmark user and use its JWT token
+BENCHMARK_AUTH_TOKEN=your_benchmark_jwt_token_here
+
+# Optional: Set to 'true' to skip auth-protected routes
+# SKIP_AUTH_ROUTES=false
--- /dev/null
+++ 	benchmarks/.gitignore
@@ -0,0 +1,2 @@
+results/
+node_modules/
--- /dev/null
+++ 	benchmarks/package.json
@@ -0,0 +1,18 @@
+{
+  "name": "@freelanceflow/benchmarks",
+  "version": "1.0.0",
+  "private": true,
+  "description": "API benchmark suite for FreelanceFlow",
+  "scripts": {
+    "benchmark": "node run-benchmarks.js",
+    "benchmark:smoke": "node run-benchmarks.js --smoke",
+    "benchmark:ci": "node run-benchmarks.js --ci"
+  },
+  "dependencies": {
+    "autocannon": "^7.15.0",
+    "dotenv": "^16.3.1"
+  },
+  "devDependencies": {},
+  "engines": {
+    "node": ">=18.0.0"
+  }
+}
--- /dev/null
+++ 	benchmarks/run-benchmarks.js
@@ -0,0 +1,526 @@
+#!/usr/bin/env node
+
+const fs = require('fs');
+const path = require('path');
+const autocannon = require('autocannon');
+require('dotenv').config({ path: path.join(__dirname, '.env.benchmark') });
+
+// Configuration
+const TARGET_URL = process.env.BENCHMARK_TARGET_URL || 'http://localhost:3000';
+const AUTH_TOKEN = process.env.BENCHMARK_AUTH_TOKEN || '';
+const SKIP_AUTH = process.env.SKIP_AUTH_ROUTES === 'true';
+const IS_SMOKE = process.argv.includes('--smoke');
+const IS_CI = process.argv.includes('--ci');
+
+// Benchmark settings
+const DURATION = IS_SMOKE ? 10 : 30; // seconds
+const CONNECTIONS = IS_SMOKE ? 10 : 50;
+const PIPELINE = IS_SMOKE ? 1 : 10;
+
+// Thresholds for CI regression gate
+const THRESHOLDS = loadThresholds();
+
+function loadThresholds() {
+  try {
+    const thresholdsPath = path.join(__dirname, 'thresholds.json');
+    const data = fs.readFileSync(thresholdsPath, 'utf8');
+    return JSON.parse(data);
+  } catch (err) {
+    console.warn('Warning: Could not load thresholds.json, using defaults');
+    return {
+      p99LatencyMs: 500,
+      errorRatePercent: 5
+    };
+  }
+}
+
+// Results storage
+const results = [];
+let currentEndpoint = null;
+
+// Auth header
+const authHeaders = AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};
+
+// Endpoint definitions with realistic payloads
+const ENDPOINTS = [
+  // Health check (unauthenticated)
+  {
+    name: 'GET /health',
+    method: 'GET',
+    path: '/health',
+    requiresAuth: false
+  },
+  // Auth routes
+  {
+    name: 'POST /api/auth/register',
+    method: 'POST',
+    path: '/api/auth/register',
+    requiresAuth: false,
+    body: {
+      email: `benchmark${Date.now()}@example.com`,
+      password: 'BenchmarkPass123!',
+      firstName: 'Bench',
+      lastName: 'Mark',
+      role: 'FREELANCER'
+    }
+  },
+  {
+    name: 'POST /api/auth/login',
+    method: 'POST',
+    path: '/api/auth/login',
+    requiresAuth: false,
+    body: {
+      email: 'benchmark@example.com',
+      password: 'BenchmarkPass123!'
+    }
+  },
+  // User routes
+  {
+    name: 'GET /api/users',
+    method: 'GET',
+    path: '/api/users?page=1&limit=20',
+    requiresAuth: true
+  },
+  {
+    name: 'GET /api/users/:id',
+    method: 'GET',
+    path: '/api/users/1',
+    requiresAuth: true
+  },
+  // Job routes
+  {
+    name: 'GET /api/jobs',
+    method: 'GET',
+    path: '/api/jobs?page=1&limit=20&sort=createdAt:desc',
+    requiresAuth: false
+  },
+  {
+    name: 'GET /api/jobs/:id',
+    method: 'GET',
+    path: '/api/jobs/1',
+    requiresAuth: false
+  },
+  {
+    name: 'POST /api/jobs',
+    method: 'POST',
+    path: '/api/jobs',
+    requiresAuth: true,
+    body: {
+      title: 'Benchmark Job Posting',
+      description: 'This is a realistic job description for benchmarking purposes. It contains enough text to simulate a typical job posting payload size in production environments.',
+      budget: 5000,
+      category: 'Software Development',
+      skills: ['JavaScript', 'TypeScript', 'Node.js', 'React'],
+      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
+    }
+  },
+  // Proposal routes
+  {
+    name: 'GET /api/proposals',
+    method: 'GET',
+    path: '/api/proposals?jobId=1&page=1&limit=20',
+    requiresAuth: true
+  },
+  {
+    name: 'POST /api/proposals',
+    method: 'POST',
+    path: '/api/proposals',
+    requiresAuth: true,
+    body: {
+      jobId: 1,
+      coverLetter: 'This is a sample proposal cover letter for benchmarking. It simulates the typical length of a freelancer proposal with sufficient detail to demonstrate expertise and interest in the project.',
+