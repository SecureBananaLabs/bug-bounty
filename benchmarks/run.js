    javascript
    /**
     * SecureBananaLabs API Benchmark Suite
     * Measures p50/p95/p99 latency, RPS, error rate, TTFB
     */
    import fs from "node:fs";
    import path from "node:path";
    import { fileURLToPath } from "node:url";
    import autocannon from "autocannon";
    
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const HOST = process.env.BENCHMARK_HOST || "http://localhost:4000";
    const AUTH_TOKEN = process.env.BENCHMARK_AUTH_TOKEN || "";
    const DURATION = Number(process.env.BENCHMARK_DURATION) || 30;
    const CONNECTIONS = Number(process.env.BENCHMARK_CONNECTIONS) || 10;
    const OUTPUT_DIR = path.resolve(__dirname, process.env.BENCHMARK_OUTPUT_DIR || "results");
    
    function getEndpoints() {
      const authHeaders = AUTH_TOKEN ? { authorization: Bearer ${AUTH_TOKEN} } : {};
      return [
        { name: "GET /health", method: "GET", path: "/health" },
        { name: "POST /api/auth/register", method: "POST", path: "/api/auth/register", body: { email: "benchmark@test.com", password: "Benchmark123!", name: "Benchmark User" } },
        { name: "POST /api/auth/login", method: "POST", path: "/api/auth/login", body: { email: "benchmark@test.com", password: "Benchmark123!" } },
        { name: "POST /api/auth/refresh", method: "POST", path: "/api/auth/refresh", body: { refreshToken: "dummy-refresh-token" }, expect2xx: false },
        { name: "GET /api/users/", method: "GET", path: "/api/users/", ...authHeaders },
        { name: "POST /api/users/", method: "POST", path: "/api/users/", body: { name: "Benchmark User", email: "benchmark.user@test.com" }, ...authHeaders },
        { name: "GET /api/jobs/", method: "GET", path: "/api/jobs/" },
        { name: "POST /api/jobs/", method: "POST", path: "/api/jobs/", body: { title: "Benchmark Job", description: "Performance testing job posting.", budget: 5000, category: "development", skills: ["node.js", "react"] }, ...authHeaders },
        { name: "GET /api/proposals/", method: "GET", path: "/api/proposals/" },
        { name: "POST /api/proposals/", method: "POST", path: "/api/proposals/", body: { coverLetter: "Interested in this project.", rate: 75 }, ...authHeaders },
        { name: "POST /api/payments/", method: "POST", path: "/api/payments/", body: { amount: 100, currency: "usd" }, ...authHeaders },
        { name: "GET /api/reviews/", method: "GET", path: "/api/reviews/" },
        { name: "POST /api/reviews/", method: "POST", path: "/api/reviews/", body: { rating: 5, comment: "Great performance." }, ...authHeaders },
        { name: "GET /api/messages/", method: "GET", path: "/api/messages/" },
        { name: "POST /api/messages/", method: "POST", path: "/api/messages/", body: { recipientId: "benchmark-user", content: "Hello, benchmark message." }, ...authHeaders },
        { name: "GET /api/notifications/", method: "GET", path: "/api/notifications/" },
        { name: "POST /api/notifications/", method: "POST", path: "/api/notifications/", body: { type: "info", message: "Benchmark test." }, ...authHeaders },
        { name: "POST /api/uploads/", method: "POST", path: "/api/uploads/" },
        { name: "GET /api/search/", method: "GET", path: "/api/search/?q=benchmark&type=jobs" },
        { name: "GET /api/admin/metrics", method: "GET", path: "/api/admin/metrics", ...authHeaders },
      ];
    }
    
    function buildOpts(ep) {
      return {
        url: new URL(ep.path, HOST).href,
        method: ep.method || "GET",
        connections: CONNECTIONS, duration: DURATION,
        headers: { "content-type": "application/json", ...(ep.authorization ? { authorization: ep.authorization } : {}) },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
        latency: true, skipBodies: true,
      };
    }
    
    async function main() {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      const endpoints = getEndpoints();
      const allMetrics = [];
      
      for (const ep of endpoints) {
        const opts = buildOpts(ep);
        console.log(  Running: ${ep.name});
        try {
          const result = await autocannon(opts);
          const lat = result.latency;
          const req = result.requests;
          allMetrics.push({
            endpoint: ep.name, method: ep.method, path: ep.path,
            metrics: {
              latency: { p50: lat.p50, p95: lat.p95, p99: lat.p99, avg: lat.average, min: lat.min, max: lat.max },
              throughput: { rps: req.average, total: req.total },
              errors: { total: (result.errors?.total||0) + (result.non2xx||0), timeouts: result.timeouts?.total||0 },
            },
          });
          console.log(  [DONE] ${ep.name} | p50:${lat.p50.toFixed(1)}ms p95:${lat.p95.toFixed(1)}ms p99:${lat.p99.toFixed(1)}ms RPS:${req.average.toFixed(0)});
        } catch (err) {
          console.log(  [FAIL] ${ep.name} | ${err.message});
        }
      }
      
      const report = { timestamp: new Date().toISOString(), target: HOST, endpoints: allMetrics };
      fs.writeFileSync(path.join(OUTPUT_DIR, "full-results.json"), JSON.stringify(report, null, 2));
      
      let htmlRows = allMetrics.map(m => {
        const l = m.metrics.latency;
        return <tr><td>${m.endpoint}</td><td>${l.p50.toFixed(1)}</td><td>${l.p95.toFixed(1)}</td><td>${l.p99.toFixed(1)}</td><td>${l.avg.toFixed(1)}</td><td>${m.metrics.throughput.rps.toFixed(0)}</td><td>${m.metrics.errors.total}</td></tr>;
      }).join("\n");
      
      const html = <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Benchmark Report</title><style>body{font-family:sans-serif;background:#0d1117;color:#c9d1d9;padding:2rem}h1{color:#58a6ff}table{width:100%;border-collapse:collapse}th{background:#1c2128;padding:.75rem;text-align:left;font-size:.8rem;text-transform:uppercase}td{padding:.75rem;border-top:1px solid #21262d}tr:hover td{background:#1c2128}</style></head><body><h1>API Benchmark Report</h1><h2>${HOST} | ${new Date().toISOString()}</h2><table><thead><tr><th>Endpoint</th><th>p50(ms)</th><th>p95(ms)</th><th>p99(ms)</th><th>Avg(ms)</th><th>RPS</th><th>Errors</th></tr></thead><tbody>${htmlRows}</tbody></table></body></html>;
      fs.writeFileSync(path.join(OUTPUT_DIR, "benchmark-report.html"), html);
      console.log("\\nDone! Results in", OUTPUT_DIR);
    }
    
    main().catch(err => { console.error(err); process.exit(1); });
