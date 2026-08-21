import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

  it('returns 200 with the shared success envelope and service name', async () => {
  const app = createApp();
  const server = app.listen(0);
    expect(res.body).toEqual({ success: true, data: { service: 'api' } });
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api" });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
