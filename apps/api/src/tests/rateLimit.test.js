import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("rate-limit stores are isolated per app instance", async () => {
  const app1 = createApp();
  const app2 = createApp();

  const server1 = app1.listen(0);
  const server2 = app2.listen(0);

  await Promise.all([
    new Promise((resolve, reject) => {
      server1.once("listening", resolve);
      server1.once("error", reject);
    }),
    new Promise((resolve, reject) => {
      server2.once("listening", resolve);
      server2.once("error", reject);
    })
  ]);

  const { port: port1 } = server1.address();
  const { port: port2 } = server2.address();

  // Exhaust rate limit on app1 (limit is 200, send 210)
  const makeRequest = (port) =>
    fetch(`http://127.0.0.1:${port}/health`).then((r) => r.status);

  const results1 = await Promise.all(
    Array.from({ length: 210 }, () => makeRequest(port1))
  );

  const got429 = results1.filter((s) => s === 429).length;
  assert.ok(got429 >= 1, "Expected at least one 429 on first instance after exhausting limit");

  // Second instance should still be fresh
  const status2 = await makeRequest(port2);
  assert.equal(status2, 200, "Second instance should not be rate-limited");

  await Promise.all([
    new Promise((resolve, reject) => {
      server1.close((error) => (error ? reject(error) : resolve()));
    }),
    new Promise((resolve, reject) => {
      server2.close((error) => (error ? reject(error) : resolve()));
    })
  ]);
});
