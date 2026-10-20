import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { requestSample, runLoad } from "../http.mjs";

async function serverFor(t, handler) {
  const server = http.createServer(handler).listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  return `http://127.0.0.1:${server.address().port}`;
}

test("TTFB is distinct from complete-response latency", async (t) => {
  const url = await serverFor(t, (_req, res) => {
    setTimeout(() => { res.writeHead(200); res.flushHeaders(); setTimeout(() => res.end("ok"), 80); }, 30);
  });
  const sample = await requestSample(url, { method: "GET", path: "/", expectedStatus: 200 });
  assert.equal(sample.error, false);
  assert.ok(sample.ttfbMs >= 20);
  assert.ok(sample.durationMs - sample.ttfbMs >= 50);
});

test("non-success statuses are preserved and no redirect is followed", async (t) => {
  const url = await serverFor(t, (_req, res) => { res.writeHead(429); res.end("limited"); });
  const sample = await requestSample(url, { method: "GET", path: "/", expectedStatus: 200 });
  assert.equal(sample.statusCode, 429);
  assert.equal(sample.expectedStatus, 200);
});

test("deadline aborts a hung response and records an error", async (t) => {
  const url = await serverFor(t, (_req, _res) => {});
  const sample = await requestSample(url, { method: "GET", path: "/", expectedStatus: 200 }, { timeoutMs: 30 });
  assert.equal(sample.error, "timeout");
  assert.equal(sample.ttfbMs, null);
});

test("closed-loop workers send exactly the bounded request count", async (t) => {
  let received = 0;
  const url = await serverFor(t, (_req, res) => { received++; res.end("ok"); });
  const { samples, elapsedMs } = await runLoad(url, { method: "GET", path: "/", expectedStatus: 200 },
    { requests: 17, concurrency: 4, timeoutMs: 1000 });
  assert.equal(received, 17);
  assert.equal(samples.length, 17);
  assert.ok(samples.every((s) => s.statusCode === 200 && !s.error && s.ttfbMs !== null));
  assert.ok(elapsedMs >= Math.max(...samples.map((s) => s.completedAtMs)));
});
