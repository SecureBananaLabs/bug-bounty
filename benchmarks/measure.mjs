import http from "node:http";
import https from "node:https";
import { performance } from "node:perf_hooks";
import { keyOf, requestPayload } from "./endpoints.mjs";

export function percentile(values, percent) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(percent / 100 * sorted.length) - 1)];
}

export function summarize(samples, elapsedMs) {
  const latency = samples.map((s) => s.latencyMs);
  const ttfb = samples.filter((s) => s.ttfbMs !== null).map((s) => s.ttfbMs);
  const completed = samples.map((s) => s.completedMs).sort((a, b) => a - b);
  let left = 0, peak = 0;
  for (let right = 0; right < completed.length; right++) {
    while (completed[right] - completed[left] >= 1000) left++;
    peak = Math.max(peak, right - left + 1);
  }
  const percentiles = (xs) => ({ p50: percentile(xs, 50), p95: percentile(xs, 95), p99: percentile(xs, 99) });
  const statuses = {};
  for (const s of samples) statuses[s.status || "transport-error"] = (statuses[s.status || "transport-error"] || 0) + 1;
  return {
    requests: samples.length, errors: samples.filter((s) => !s.ok).length,
    errorRatePercent: 100 * samples.filter((s) => !s.ok).length / samples.length,
    latencyMs: percentiles(latency), ttfbMs: percentiles(ttfb),
    sustainedRps: samples.length / (elapsedMs / 1000),
    peakRps: peak / (Math.min(elapsedMs, 1000) / 1000),
    elapsedMs, statuses
  };
}

function requestOnce(target, endpoint, agent, token, timeoutMs, clockStart) {
  const started = performance.now();
  const { body, type } = requestPayload(endpoint);
  const headers = {};
  if (body) { headers["content-type"] = type; headers["content-length"] = body.length; }
  if (endpoint.authenticated) headers.authorization = `Bearer ${token}`;
  const transport = target.protocol === "https:" ? https : http;
  return new Promise((resolve) => {
    let ttfbMs = null, settled = false, status = 0;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok, status, ttfbMs, latencyMs: performance.now() - started, completedMs: performance.now() - clockStart });
    };
    const req = transport.request(new URL(endpoint.path || endpoint.route, target), { method: endpoint.method, headers, agent }, (res) => {
      // Node emits response once the initial response headers have arrived.
      ttfbMs = performance.now() - started;
      status = res.statusCode;
      res.on("end", () => finish(status === endpoint.status));
      res.on("error", () => finish(false));
      res.on("aborted", () => finish(false));
      res.resume(); // Fully drain responses; do not retain tokens or response data.
    });
    const timer = setTimeout(() => req.destroy(new Error("Benchmark request deadline exceeded")), timeoutMs);
    req.on("error", () => finish(false));
    req.end(body);
  });
}

export async function measureEndpoint(target, endpoint, { requests, concurrency, timeoutMs, token, warmup = 2 }) {
  const Agent = target.protocol === "https:" ? https.Agent : http.Agent;
  const agent = new Agent({ keepAlive: true, maxSockets: concurrency });
  try {
    for (let i = 0; i < warmup; i++) await requestOnce(target, endpoint, agent, token, timeoutMs, performance.now());
    const start = performance.now();
    let next = 0;
    const samples = [];
    await Promise.all(Array.from({ length: concurrency }, async () => {
      while (next++ < requests) samples.push(await requestOnce(target, endpoint, agent, token, timeoutMs, start));
    }));
    return { endpoint: keyOf(endpoint), payloadBytes: requestPayload(endpoint).body?.length || 0, ...summarize(samples, performance.now() - start) };
  } finally {
    agent.destroy();
  }
}

export function regressionFailures(results, thresholds) {
  const failures = [];
  for (const result of results) {
    const threshold = thresholds[result.endpoint];
    if (!threshold) { failures.push(`${result.endpoint}: missing threshold`); continue; }
    if (!Number.isFinite(threshold.p99Ms) || threshold.p99Ms <= 0 || !Number.isFinite(threshold.maxErrorRatePercent) || threshold.maxErrorRatePercent < 0 || threshold.maxErrorRatePercent > 100) {
      failures.push(`${result.endpoint}: invalid threshold`); continue;
    }
    if (result.latencyMs.p99 > threshold.p99Ms) failures.push(`${result.endpoint}: p99 ${result.latencyMs.p99.toFixed(2)}ms exceeds ${threshold.p99Ms}ms`);
    if (result.errorRatePercent > threshold.maxErrorRatePercent) failures.push(`${result.endpoint}: error rate ${result.errorRatePercent.toFixed(2)}% exceeds ${threshold.maxErrorRatePercent}%`);
  }
  return failures;
}
