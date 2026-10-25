import autocannon from "autocannon";
import { requestHeaders } from "./endpoints.js";
import { errorRate, round, summarize } from "./lib/metrics.js";
import { measureTtfb } from "./lib/ttfb.js";

// Latency samples are collected per response so p50/p95/p99 are computed from
// raw measurements; autocannon's own histogram does not expose p95.
const MAX_LATENCY_SAMPLES = 2_000_000;

/**
 * @param {import("./endpoints.js").BenchmarkEndpoint} endpoint
 * @param {{
 *   baseUrl: string,
 *   token: string,
 *   connections: number,
 *   duration: number,
 *   pipelining: number,
 *   ttfbSamples: number
 * }} options
 */
export async function benchmarkEndpoint(
  endpoint,
  { baseUrl, token, connections, duration, pipelining, ttfbSamples }
) {
  const headers = requestHeaders(endpoint, token);
  const latencySamples = [];

  const tracker = autocannon({
    url: new URL(endpoint.path, baseUrl).toString(),
    method: endpoint.method,
    headers,
    body: endpoint.body,
    connections,
    duration,
    pipelining,
    timeout: 10,
    setupClient(client) {
      client.on("response", (_statusCode, _bytes, durationMs) => {
        if (latencySamples.length < MAX_LATENCY_SAMPLES) {
          latencySamples.push(durationMs);
        }
      });
    }
  });

  const result = await tracker;

  const ttfb = await measureTtfb({ baseUrl, endpoint, headers, samples: ttfbSamples });
  const completed = result.requests.total;
  const non2xx = result.non2xx;
  const transportErrors = result.errors;
  const timeouts = result.timeouts;

  return {
    key: endpoint.key,
    method: endpoint.method,
    route: endpoint.route,
    auth: endpoint.auth,
    schema: endpoint.schema,
    payloadBytes: endpoint.body ? Buffer.byteLength(endpoint.body) : 0,
    latency: summarize(latencySamples),
    ttfb,
    rps: {
      sustained: round(result.requests.average),
      peak:
        Number.isFinite(result.requests.max) && result.requests.max < Number.MAX_SAFE_INTEGER
          ? result.requests.max
          : null
    },
    errorRatePct: errorRate({
      completed,
      non2xx,
      errors: transportErrors,
      timeouts
    }),
    requests: {
      completed,
      sent: result.requests.sent ?? completed,
      non2xx,
      errors: transportErrors,
      timeouts,
      resets: result.resets
    },
    statusCodes: Object.fromEntries(
      Object.entries(result.statusCodeStats).map(([code, stats]) => [code, stats.count])
    )
  };
}

/**
 * Run every endpoint sequentially so each measurement gets the whole machine.
 *
 * @param {import("./endpoints.js").BenchmarkEndpoint[]} endpoints
 * @param {object} options
 * @param {(event:object)=>void} [options.onEvent]
 */
export async function runSuite(endpoints, options) {
  const { onEvent, ...benchmarkOptions } = options;
  const results = [];

  for (const [index, endpoint] of endpoints.entries()) {
    onEvent?.({ type: "start", endpoint, index, total: endpoints.length });
    const result = await benchmarkEndpoint(endpoint, benchmarkOptions);
    results.push(result);
    onEvent?.({ type: "done", endpoint, result, index, total: endpoints.length });
  }

  return results;
}
