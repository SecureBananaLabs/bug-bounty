export function percentile(values, target) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil((target / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export function roundMetric(value) {
  return Math.round(value * 100) / 100;
}

export function summarizeSamples(samples, durationMs) {
  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfb = samples.map((sample) => sample.ttfbMs);
  const failures = samples.filter((sample) => sample.error || sample.status >= 400).length;
  const statusCodes = {};

  for (const sample of samples) {
    const key = sample.status ? String(sample.status) : "error";
    statusCodes[key] = (statusCodes[key] ?? 0) + 1;
  }

  return {
    requests: samples.length,
    errors: failures,
    errorRatePercent: roundMetric((failures / Math.max(1, samples.length)) * 100),
    latencyMs: {
      p50: roundMetric(percentile(latencies, 50)),
      p95: roundMetric(percentile(latencies, 95)),
      p99: roundMetric(percentile(latencies, 99))
    },
    ttfbMs: {
      p50: roundMetric(percentile(ttfb, 50)),
      p95: roundMetric(percentile(ttfb, 95)),
      p99: roundMetric(percentile(ttfb, 99))
    },
    rps: {
      sustained: roundMetric(samples.length / Math.max(0.001, durationMs / 1000)),
      peak: peakRequestsPerSecond(samples)
    },
    statusCodes
  };
}

function peakRequestsPerSecond(samples) {
  const buckets = new Map();
  for (const sample of samples) {
    const key = Math.floor(sample.completedAtMs / 1000);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Math.max(0, ...buckets.values());
}

export function renderMarkdownReport(report) {
  const lines = [
    `# API Benchmark Report`,
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `Target: ${report.target}`,
    `Requests per endpoint: ${report.requestsPerEndpoint}`,
    `Concurrency: ${report.concurrency}`,
    "",
    "| Endpoint | Method | Path | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Statuses |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const endpoint of report.endpoints) {
    const fields = [
      endpoint.name,
      endpoint.method,
      endpoint.path,
      endpoint.latencyMs.p50,
      endpoint.latencyMs.p95,
      endpoint.latencyMs.p99,
      endpoint.ttfbMs.p95,
      endpoint.rps.sustained,
      endpoint.rps.peak,
      endpoint.errorRatePercent,
      Object.entries(endpoint.statusCodes)
        .map(([status, count]) => `${status}:${count}`)
        .join(", ")
    ];

    lines.push(
      `| ${fields.join(" | ")} |`
    );
  }

  return `${lines.join("\n")}\n`;
}
