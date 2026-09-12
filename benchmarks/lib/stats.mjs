export function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function summarize(samples, durationMs) {
  const latencies = samples.map((s) => s.latencyMs);
  const ttfbs = samples.map((s) => s.ttfbMs);
  const failures = samples.filter((s) => !s.ok).length;
  const successes = samples.length - failures;
  const statusCounts = {};
  for (const s of samples) statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
  const avg = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const ttfbAvg = ttfbs.length ? ttfbs.reduce((a, b) => a + b, 0) / ttfbs.length : 0;
  return {
    requests: samples.length,
    successes,
    failures,
    statusCounts,
    errorRate: samples.length ? failures / samples.length : 0,
    requestsPerSecond: durationMs ? samples.length / (durationMs / 1000) : 0,
    latencyMs: {
      min: latencies.length ? Math.min(...latencies) : 0,
      avg,
      p50: percentile(latencies, 50),
      p90: percentile(latencies, 90),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      max: latencies.length ? Math.max(...latencies) : 0
    },
    ttfbMs: {
      min: ttfbs.length ? Math.min(...ttfbs) : 0,
      avg: ttfbAvg,
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99),
      max: ttfbs.length ? Math.max(...ttfbs) : 0
    }
  };
}
