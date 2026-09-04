import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) { console.log('No results!'); process.exit(1); }
const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json') && f.startsWith('benchmark-')).sort().reverse();
if (files.length === 0) { console.log('No results!'); process.exit(1); }
const latest = JSON.parse(fs.readFileSync(path.join(resultsDir, files[0]), 'utf-8'));
let md = '# 📊 FreelanceFlow Benchmark Report\n\n';
md += '**Generated:** ' + latest.timestamp + '\n';
md += '**Target:** ' + latest.baseUrl + '\n\n';
md += '## 📈 Summary\n\n';
md += '| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Errors | TTFB (ms) |\n';
md += '|----------|----------|----------|----------|-----|--------|-----------|\n';
for (const r of latest.results) {
  md += '| ' + r.endpoint + ' | ' + r.latency.p50 + ' | ' + r.latency.p95 + ' | ' + r.latency.p99 + ' | ' + r.requests.avg.toFixed(1) + ' | ' + r.errors + ' | ' + r.ttfb.toFixed(2) + ' |\n';
}
md += '\n## 🔍 Detailed\n\n';
for (const r of latest.results) {
  md += '### ' + r.endpoint + ' (`' + r.method + ' ' + r.path + '`)\n\n';
  md += '- **Duration:** ' + r.duration + 's | **Connections:** ' + r.connections + '\n';
  md += '- **Latency:** avg=' + r.latency.avg + 'ms, p50=' + r.latency.p50 + 'ms, p95=' + r.latency.p95 + 'ms, p99=' + r.latency.p99 + 'ms, max=' + r.latency.max + 'ms\n';
  md += '- **Throughput:** avg=' + r.throughput.avg.toFixed(1) + ' req/s, total=' + r.throughput.total + '\n';
  md += '- **Errors:** ' + r.errors + ' | **Timeouts:** ' + r.timeouts + ' | **Non-2xx:** ' + r.non2xx + '\n\n';
}
fs.writeFileSync(path.join(resultsDir, 'REPORT.md'), md);
console.log('✅ Report saved: ' + path.join(resultsDir, 'REPORT.md'));
