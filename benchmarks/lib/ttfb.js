/**
 * Time-to-first-byte sampler.
 * Issues N sequential requests and measures the time from request dispatch
 * until the first byte of the response (headers received).
 */
import http from "node:http";
import https from "node:https";

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

export async function sampleTtfb(url, { samples = 50, headers = {}, method = "GET", body = null } = {}) {
  const lib = url.startsWith("https") ? https : http;
  const samplesMs = [];

  for (let i = 0; i < samples; i++) {
    const ttfb = await new Promise((resolve, reject) => {
      const start = process.hrtime.bigint();
      const req = lib.request(url, { method, headers }, (res) => {
        const firstByte = Number(process.hrtime.bigint() - start) / 1e6;
        res.resume(); // drain body
        res.on("end", () => resolve(firstByte));
        res.on("error", reject);
      });
      req.on("error", reject);
      req.setTimeout(15000, () => req.destroy(new Error("ttfb timeout")));
      if (body) req.write(body);
      req.end();
    });
    samplesMs.push(ttfb);
  }

  samplesMs.sort((a, b) => a - b);
  return {
    samples: samplesMs.length,
    min: +samplesMs[0].toFixed(2),
    p50: +percentile(samplesMs, 50).toFixed(2),
    p95: +percentile(samplesMs, 95).toFixed(2),
    p99: +percentile(samplesMs, 99).toFixed(2),
    max: +samplesMs[samplesMs.length - 1].toFixed(2),
  };
}
