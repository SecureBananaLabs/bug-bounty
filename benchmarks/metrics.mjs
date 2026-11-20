import http from "node:http";
import https from "node:https";
import { performance } from "node:perf_hooks";
export function percentile(values, q) {
  if (!values.length) return null;
  const sorted = [...values].sort((a,b) => a-b);
  return sorted[Math.max(0, Math.ceil(sorted.length * q) - 1)];
}
export function request(url, { method, headers, data, timeout = 5000, agent }) {
  return new Promise(resolve => {
    const start = performance.now(); let ttfb = null; let done = false;
    const finish = status => { if (!done) { done = true; resolve({ status, latency: performance.now()-start, ttfb }); } };
    const req = (url.protocol === "https:" ? https : http).request(url, { method, headers, agent }, res => {
      // IncomingMessage is emitted after the first response bytes (headers).
      ttfb = performance.now()-start;
      res.on("error", () => finish(0)); res.on("aborted", () => finish(0));
      res.on("end", () => finish(res.statusCode)); res.resume();
    });
    const timer = setTimeout(() => req.destroy(new Error("request deadline")), timeout);
    req.on("error", () => finish(0)); req.on("close", () => clearTimeout(timer));
    req.end(data);
  });
}
export async function measure(url, options, { duration, concurrency, expected }) {
  const samples = []; const start = performance.now(); const deadline = start + duration*1000;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (performance.now() < deadline) {
      const sample = await request(url, options);
      samples.push({ ...sample, completed: (performance.now()-start)/1000 });
    }
  }));
  const elapsed = (performance.now()-start)/1000;
  const bins = new Map(); for (const s of samples) { const i = Math.floor(s.completed); bins.set(i, (bins.get(i) ?? 0)+1); }
  // Peak is the busiest complete 1-second window. Partial final windows are excluded.
  const full = [...bins].filter(([i]) => i+1 <= elapsed).map(([,n]) => n);
  return { requests: samples.length, seconds: elapsed,
    latencyMs: { p50: percentile(samples.map(s=>s.latency), .50), p95: percentile(samples.map(s=>s.latency), .95), p99: percentile(samples.map(s=>s.latency), .99) },
    ttfbMs: { p50: percentile(samples.flatMap(s=>s.ttfb===null?[]:[s.ttfb]), .50), p95: percentile(samples.flatMap(s=>s.ttfb===null?[]:[s.ttfb]), .95), p99: percentile(samples.flatMap(s=>s.ttfb===null?[]:[s.ttfb]), .99) },
    sustainedRps: samples.length/elapsed, peakRps: full.length ? Math.max(...full) : null,
    errorRatePercent: 100*samples.filter(s=>s.status!==expected).length/samples.length,
    statuses: samples.reduce((a,s)=>(a[s.status]=(a[s.status]??0)+1,a), {}) };
}
export function failures(results, thresholds) {
  return results.flatMap(r => {
    const t = thresholds.endpoints?.[r.endpoint] ?? thresholds.default;
    return r.requests === 0 || !Number.isFinite(r.latencyMs.p99) || r.latencyMs.p99 > t.p99Ms || r.errorRatePercent > t.errorRatePercent ? [r.endpoint] : [];
  });
}
