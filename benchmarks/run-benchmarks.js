#!/usr/bin/env node

/**
 * API Benchmark Runner
 * Runs autocannon against all configured API endpoints.
 * Captures: p50, p95, p99 latency, RPS, error rate, TTFB
 */

const autocannon = require("autocannon");
const fs = require("fs");
const path = require("path");
const os = require("os");
const config = require("./benchmark-config.js");

const isQuick = process.argv.includes("--quick");
const settings = isQuick ? config.quickSettings : config.settings;
const resultsDir = path.join(__dirname, "results");

// Ensure results directory exists
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Collect system info
const systemInfo = {
  cpu: os.cpus()[0]?.model || "unknown",
  cores: os.cpus().length,
  ram: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
  platform: `${os.platform()} ${os.release()}`,
  node: process.version,
  timestamp: new Date().toISOString(),
  mode: isQuick ? "quick (CI smoke)" : "full",
};

console.log(`\n🔬 API Benchmark Suite — ${systemInfo.timestamp}`);
console.log(`   Target: ${config.target}`);
console.log(`   Mode: ${systemInfo.mode}`);
console.log(`   Connections: ${settings.connections}, Duration: ${settings.duration}s\n`);

async function runEndpoint(endpoint) {
  const url = new URL(endpoint.path, config.target);
  
  const opts = {
    url: url.href,
    connections: settings.connections,
    duration: settings.duration,
    pipelining: settings.pipelining,
    timeout: 10,
    method: endpoint.method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Add auth header for protected routes
  if (endpoint.protected && config.authToken) {
    opts.headers["Authorization"] = `Bearer ${config.authToken}`;
  }

  // Add body for POST/PUT requests
  if (endpoint.body) {
    opts.body = JSON.stringify(endpoint.body);
    if (!opts.headers) opts.headers = {};
    opts.headers["Content-Type"] = "application/json";
  }

  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) {
        console.error(`   ❌ ${endpoint.name}: ${err.message}`);
        resolve(null);
        return;
      }

      const summary = {
        endpoint: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        protected: endpoint.protected,
        latency: {
          p50: result.latency.p50,
          p95: result.latency.p95,
          p99: result.latency.p99,
          average: result.latency.average,
        },
        requests: {
          total: result.requests.total,
          sent: result.requests.sent,
          average: result.requests.average,
          max: result.requests.max,
        },
        throughput: {
          total: result.throughput.total,
          average: result.throughput.average,
        },
        errors: result.errors,
        timeouts: result.timeouts,
        non2xx: result.non2xx,
        "1xx": result["1xx"],
        "2xx": result["2xx"],
        "3xx": result["3xx"],
        "4xx": result["4xx"],
        "5xx": result["5xx"],
        errorRate: result.requests.total > 0 
          ? ((result.errors + result.timeouts + result.non2xx) / (result.requests.total + result.requests.sent) * 100).toFixed(2) + "%"
          : "N/A",
      };

      console.log(`   📊 ${endpoint.name}`);
      console.log(`      ${endpoint.method} ${endpoint.path}${endpoint.protected ? ' 🔒' : ''}`);
      console.log(`      Latency: ${summary.latency.p50.toFixed(1)}ms (p50) / ${summary.latency.p95.toFixed(1)}ms (p95) / ${summary.latency.p99.toFixed(1)}ms (p99)`);
      console.log(`      RPS: ${summary.requests.average.toFixed(1)} | Errors: ${summary.errors} | Non2xx: ${summary.non2xx}`);
      
      resolve(summary);
    });
  });
}

async function runAll() {
  const allResults = { system: systemInfo, endpoints: [] };

  for (const endpoint of config.endpoints) {
    const result = await runEndpoint(endpoint);
    allResults.endpoints.push(result);
  }

  return allResults;
}

// Write results
function writeResults(results) {
  // JSON output
  const jsonPath = path.join(resultsDir, `benchmark-${Date.now()}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 JSON results: ${jsonPath}`);

  // Also write latest copy for easy reference
  const latestPath = path.join(resultsDir, "latest.json");
  fs.writeFileSync(latestPath, JSON.stringify(results, null, 2));

  // Markdown summary
  const mdPath = path.join(resultsDir, "benchmark-summary.md");
  const md = generateMarkdown(results);
  fs.writeFileSync(mdPath, md);
  console.log(`📁 Markdown summary: ${mdPath}`);

  return { jsonPath, mdPath };
}

function generateMarkdown(results) {
  let md = `# API Benchmark Results\n\n`;
  md += `**Timestamp**: ${results.system.timestamp}\n`;
  md += `**Mode**: ${results.system.mode}\n`;
  md += `**Target**: ${config.target}\n\n`;

  md += `## System\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| CPU | ${results.system.cpu} (${results.system.cores} cores) |\n`;
  md += `| RAM | ${results.system.ram} |\n`;
  md += `| Platform | ${results.system.platform} |\n`;
  md += `| Node.js | ${results.system.node} |\n\n`;

  md += `## Endpoint Results\n\n`;
  md += `| Endpoint | Method | Path | Auth | p50(ms) | p95(ms) | p99(ms) | RPS | Errors | Status |\n`;
  md += `|----------|--------|------|:----:|:-------:|:-------:|:-------:|:---:|:------:|:------:|\n`;

  for (const r of results.endpoints) {
    if (!r) {
      md += `| N/A | - | - | - | - | - | - | - | - | ❌ |\n`;
      continue;
    }
    const status = r.errorRate === "0.00%" || r.errorRate === "N/A" ? "✅" : "⚠️";
    md += `| ${r.endpoint} | ${r.method} | ${r.path} | ${r.protected ? '🔒' : '🔓'} | ${r.latency.p50.toFixed(1)} | ${r.latency.p95.toFixed(1)} | ${r.latency.p99.toFixed(1)} | ${r.requests.average.toFixed(1)} | ${r.errors} | ${status} |\n`;
  }

  md += `\n## Error Rate Summary\n\n`;
  md += `- Total errors across all endpoints: ${results.endpoints.reduce((s, r) => s + (r?.errors || 0), 0)}\n`;
  md += `- Total timeouts: ${results.endpoints.reduce((s, r) => s + (r?.timeouts || 0), 0)}\n`;
  md += `- Total non-2xx responses: ${results.endpoints.reduce((s, r) => s + (r?.non2xx || 0), 0)}\n`;
  md += `- 4xx responses: ${results.endpoints.reduce((s, r) => s + (r?.["4xx"] || 0), 0)}\n`;
  md += `- 5xx responses: ${results.endpoints.reduce((s, r) => s + (r?.["5xx"] || 0), 0)}\n\n`;

  md += `---\n*Generated by SecureBananaLabs API Benchmark Suite*\n`;

  return md;
}

// Main
runAll()
  .then(writeResults)
  .then((paths) => {
    console.log(`\n✅ Benchmark complete!`);
    console.log(`   Summary: ${paths.mdPath}`);
    console.log(`   JSON: ${paths.jsonPath}`);
  })
  .catch((err) => {
    console.error("Benchmark failed:", err);
    process.exit(1);
  });
