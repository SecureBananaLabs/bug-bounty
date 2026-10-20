import http from "node:http";
import https from "node:https";
import { summarize } from "./metrics.js";

function requestOnce(transport, url, endpoint, headers, agent) {
  return new Promise((resolve, reject) => {
    const startedAt = process.hrtime.bigint();
    const request = transport.request(
      url,
      { method: endpoint.method, headers, agent, timeout: 10_000 },
      (response) => {
        const ttfbMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        response.resume();
        response.once("end", () => resolve({ ttfbMs, statusCode: response.statusCode ?? 0 }));
        response.once("error", reject);
      }
    );

    request.once("error", reject);
    request.once("timeout", () => request.destroy(new Error("TTFB probe timed out")));

    if (endpoint.body) request.write(endpoint.body);
    request.end();
  });
}

/**
 * Measure time-to-first-byte on a warm keep-alive connection.
 *
 * autocannon reports end-to-end latency only, so TTFB is sampled separately.
 * This probe is sequential (one request in flight) and therefore describes
 * server responsiveness, not behaviour under concurrent load.
 *
 * @param {{
 *   baseUrl: string,
 *   endpoint: import("../endpoints.js").BenchmarkEndpoint,
 *   headers: Record<string,string>,
 *   samples: number,
 *   warmup?: number
 * }} options
 */
export async function measureTtfb({ baseUrl, endpoint, headers, samples, warmup = 3 }) {
  const url = new URL(endpoint.path, baseUrl);
  const secure = url.protocol === "https:";
  const transport = secure ? https : http;
  const agent = new (secure ? https.Agent : http.Agent)({ keepAlive: true, maxSockets: 1 });

  const requestHeaders = { ...headers };
  if (endpoint.body) {
    requestHeaders["content-length"] = String(Buffer.byteLength(endpoint.body));
  }

  const values = [];
  let non2xx = 0;

  try {
    for (let index = 0; index < warmup + samples; index += 1) {
      const { ttfbMs, statusCode } = await requestOnce(
        transport,
        url,
        endpoint,
        requestHeaders,
        agent
      );

      if (index < warmup) continue;

      values.push(ttfbMs);
      if (statusCode < 200 || statusCode >= 300) non2xx += 1;
    }
  } finally {
    agent.destroy();
  }

  return { ...summarize(values), non2xx };
}
