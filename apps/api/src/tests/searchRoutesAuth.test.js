import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("search rejects callers without a bearer token", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const anonymous = await fetch(`http://127.0.0.1:${port}/api/search?q=react`);
  assert.equal(anonymous.status, 401);
  assert.deepEqual(await anonymous.json(), { success: false, message: "Unauthorized" });

  await close(server);
});

test("search returns the aggregate for an authenticated caller", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_1", role: "client" });

  const response = await fetch(`http://127.0.0.1:${port}/api/search?q=react`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.query, "react");
  assert.deepEqual(payload.data.jobs, []);

  await close(server);
});
