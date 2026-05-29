import http from 'node:http';
import { performance, PerformanceObserver } from 'node:perf_hooks';
import { createApp } from '../app.js';
import { connectDb } from '../config/db.js';
import { env } from '../config/env.js';

// 所有需要 benchmark 的端点路径（不含 host）
const ENDPOINTS = [
  '/health',
  '/api/auth',
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
];

// 每个端点的请求数量
const REQUESTS_PER_ENDPOINT = 200;
// 并发数
const CONCURRENCY = 10;

/**
 * 对某个路径发送一次 GET 请求，返回延迟和 TTFB
 */
function requestOnce(host, path) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const req = http.get(`http://${host}${path}`, (res) => {
      const ttfbEnd = performance.now();
      let firstChunk = true;
      let body = '';
      res.on('data', (chunk) => {
        if (firstChunk) {
          // TTFB 记录第一个数据块到达的时间
          // 但实际 TTFB 是第一个字节到达的时间，用 start 和第一个 data 事件的时间差
          // 这里我们使用 request 的 response 事件（头已收到）作为 TTFB 近似
          // 更精确：使用 res.once('data', ...) 但这里 response 事件就是头到达
          // 实际我们从 start 到 res 的 'response' 时间差已经是头解析完成，但接近 TTFB
          // 我们将 ttfb 设置为 response 事件时间减去 start（上面已经记了 ttfbEnd）
          // 但上面 ttfbEnd 在 res 回调里，已经是 response 事件后
          firstChunk = false;
        }
        body += chunk;
      });
      res.on('end', () => {
        const end = performance.now();
        const latency = end - start;
        const ttfb = ttfbEnd - start; // 近似
        resolve({
          path,
          status: res.statusCode,
          latency,
          ttfb,
        });
      });
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * 并发执行 N 次对同一个 path 的请求
 */
async function benchmarkEndpoint(host, path, n, concurrency) {
  const results = [];
  let nextIndex = 0;
  let active = 0;
  let completed = 0;
  let errors = 0;

  return new Promise((resolve) => {
    function startNext() {
      while (active < concurrency && nextIndex < n) {
        const idx = nextIndex++;
        active++;
        requestOnce(host, path)
          .then((result) => {
            results.push(result);
            if (result.status >= 500) errors++;
          })
          .catch((err) => {
            errors++;
            results.push({ path, status: 0, latency: NaN, ttfb: NaN, error: err.message });
          })
          .finally(() => {
            active--;
            completed++;
            if (completed >= n) {
              resolve(results);
            } else {
              startNext();
            }
          });
      }
    }
    startNext();
  });
}

/**
 * 计算百分位数
 */
function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return NaN;
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, Math.min(index, sortedArr.length - 1))];
}

/**
 * 生成报告
 */
function generateReport(rawResults) {
  const grouped = {};
  for (const r of rawResults) {
    if (!grouped[r.path]) grouped[r.path] = [];
    grouped[r.path].push(r);
  }

  const report = {
    timestamp: new Date().toISOString(),
    totalEndpoints: Object.keys(grouped).length,
    endpoints: {},
  };

  for (const [path, resArr] of Object.entries(grouped)) {
    const valid = resArr.filter((r) => !isNaN(r.latency) && r.latency > 0);
    const latencies = valid.map((r) => r.latency).sort((a, b) => a - b);
    const ttfbValues = valid.map((r) => r.ttfb).sort((a, b) => a - b);
    const errors = resArr.filter((r) => r.status >= 500 || r.error).length;
    const total = resArr.length;
    const errorRate = total > 0 ? errors / total : 0;
    const totalTime = (latencies.length > 0 ? latencies[latencies.length - 1] + (latencies[latencies.length - 1] - latencies[0]) : 1000) / 1000; // 近似总时长（秒）
    const rps = total / (totalTime > 0 ? totalTime : 1);

    report.endpoints[path] = {
      requests: total,
      errors,
      errorRate: parseFloat(errorRate.toFixed(4)),
      latency: {
        p50: percentile(latencies, 50),
        p95: percentile(latencies, 95),
        p99: percentile(latencies, 99),
        min: latencies[0] || 0,
        max: latencies[latencies.length - 1] || 0,
        avg: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      },
      ttfb: {
        p50: percentile(ttfbValues, 50),
        p95: percentile(ttfbValues, 95),
        p99: percentile(ttfbValues, 99),
        min: ttfbValues[0] || 0,
        max: ttfbValues[ttfbValues.length - 1] || 0,
        avg: ttfbValues.length > 0 ? ttfbValues.reduce((a, b) => a + b, 0) / ttfbValues.length : 0,
      },
      rps: parseFloat(rps.toFixed(2)),
    };
  }

  return report;
}

async function main() {
  // 连接数据库
  try {
    await connectDb();
    console.log('Database connected');
  } catch (err) {
    console.error('Failed to connect database. Benchmark will be partial (only health endpoint may work).');
  }

  // 创建并启动应用
  const app = createApp();
  const server = app.listen(0, () => {
    const addr = server.address();
    const host = `localhost:${addr.port}`;
    console.log(`Benchmark server started on ${host}`);

    (async () => {
      const allResults = [];
      for (const path of ENDPOINTS) {
        console.log(`Benchmarking ${path}...`);
        const res = await benchmarkEndpoint(host, path, REQUESTS_PER_ENDPOINT, CONCURRENCY);
        allResults.push(...res);
        console.log(`  Completed ${res.length} requests for ${path}`);
      }

      const report = generateReport(allResults);
      const reportPath = './benchmark-report.json';
      const fs = await import('node:fs');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\nBenchmark report written to ${reportPath}`);

      // 关闭服务器和数据库连接
      server.close();
      const { prisma } = await import('@prisma/client');
      // 如果有 prisma 连接，可以断开
      // 由于我们不知道具体 prisma 实例，这里跳过
      process.exit(0);
    })();
  });
}

main();
