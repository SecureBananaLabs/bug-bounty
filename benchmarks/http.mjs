import http from "node:http";
import { performance } from "node:perf_hooks";

// One request per keep-alive socket at a time, without pipelining or redirects.
export function requestSample(url, scenario, { agent, token, timeoutMs = 5000 } = {}) {
  return new Promise((resolve) => {
    const started = performance.now();
    let socket;
    let firstByte;
    let statusCode = null;
    let settled = false;
    let received = 0;
    const body = scenario.body === undefined ? undefined
      : Buffer.isBuffer(scenario.body) ? scenario.body : Buffer.from(JSON.stringify(scenario.body));
    const headers = Object.fromEntries(Object.entries(scenario.headers ?? {})
      .map(([name, value]) => [name.toLowerCase(), value]));
    if (body) {
      headers["content-type"] ??= "application/json";
      headers["content-length"] = body.length;
    }
    if (scenario.authenticated) headers.authorization = `Bearer ${token}`;
    const onFirstByte = () => { firstByte = performance.now() - started; };
    const finish = (error = false) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket?.removeListener("data", onFirstByte);
      resolve({ durationMs: performance.now() - started, ttfbMs: firstByte ?? null,
        statusCode, expectedStatus: scenario.expectedStatus, error });
    };
    const req = http.request(new URL(scenario.path, url), { method: scenario.method, headers, agent }, (res) => {
      statusCode = res.statusCode;
      res.on("data", (chunk) => {
        received += chunk.length;
        if (received > 8 * 1024 * 1024) req.destroy(new Error("response_limit"));
      });
      res.once("aborted", () => finish("response_aborted"));
      res.once("error", () => finish("response_error"));
      res.once("end", () => finish());
    });
    const timer = setTimeout(() => req.destroy(new Error("timeout")), timeoutMs);
    req.once("socket", (s) => {
      socket = s;
      socket.once("data", onFirstByte);
    });
    req.once("error", (error) => finish(error.message === "timeout" ? "timeout" : "network_error"));
    req.end(body);
  });
}

export async function runLoad(url, scenario, { requests, concurrency, token, timeoutMs }) {
  const agent = new http.Agent({ keepAlive: true, maxSockets: concurrency });
  const samples = [];
  let next = 0;
  const started = performance.now();
  try {
    await Promise.all(Array.from({ length: concurrency }, async () => {
      while (next++ < requests) {
        const sample = await requestSample(url, scenario, { agent, token, timeoutMs });
        samples.push({ ...sample, completedAtMs: performance.now() - started });
      }
    }));
    return { samples, elapsedMs: performance.now() - started };
  } finally {
    agent.destroy();
  }
}
