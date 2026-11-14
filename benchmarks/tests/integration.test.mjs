import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../apps/api/src/app.js";
import { scenarios } from "../scenarios.mjs";
import { startFixture } from "../lifecycle.mjs";
import { readConfig } from "../config.mjs";
import { assertScenarioCoverage } from "../coverage.mjs";

test("scenario manifest covers every method/path registered on the real Express app", () => {
  const app = createApp();
  assertScenarioCoverage(app, scenarios);
  app.get("/api/new-direct-route", (_req, res) => res.end("new"));
  assert.throws(() => assertScenarioCoverage(app, scenarios), /cover all API routes/);
});

test("real fixture seeds data, uses a dedicated token, and shuts down", async (t) => {
  const fixture = await startFixture();
  t.after(fixture.stop);
  const users = await fetch(`${fixture.url}/api/users`).then((r) => r.json());
  assert.equal(users.data.length, fixture.seedRows);
  assert.equal((await fetch(`${fixture.url}/api/admin/metrics`)).status, 401);
  assert.equal((await fetch(`${fixture.url}/api/admin/metrics`, { headers: { authorization: `Bearer ${fixture.token}` } })).status, 200);
  await fixture.stop();
  await assert.rejects(fetch(`${fixture.url}/health`));
});

test("normal createApp still enforces 200 requests per window", async (t) => {
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const url = `http://127.0.0.1:${server.address().port}/health`;
  for (let i = 0; i < 200; i++) {
    const response = await fetch(url);
    assert.equal(response.status, 200);
    await response.arrayBuffer();
  }
  assert.equal((await fetch(url)).status, 429);
});

test("configuration rejects remote targets and unbounded/invalid workloads", () => {
  for (const config of [{ BENCH_HOST: "example.com" }, { BENCH_REQUESTS: "Infinity" },
    { BENCH_CONCURRENCY: "0" }, { BENCH_WARMUP: "-1" }, { BENCH_PORT: "70000" }]) {
    assert.throws(() => readConfig(config));
  }
  assert.equal(readConfig({}).host, "127.0.0.1");
});
