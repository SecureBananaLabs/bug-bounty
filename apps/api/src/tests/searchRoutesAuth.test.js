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

test("GET /api/search rejects callers without a bearer token", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const anonymous = await fetch(`http://127.0.0.1:${port}/api/search?q=designer`);
  assert.equal(anonymous.status, 401);
  const anonymousBody = await anonymous.json();
  assert.equal(anonymousBody.success, false);
  assert.equal(anonymousBody.message, "Unauthorized");

  const malformed = await fetch(`http://127.0.0.1:${port}/api/search?q=designer`, {
    headers: { Authorization: "Bearer not-a-real-token" }
  });
  assert.equal(malformed.status, 401);
  const malformedBody = await malformed.json();
  assert.equal(malformedBody.message, "Invalid token");

  await close(server);
});

test("GET /api/search answers a bearer token holder", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const token = signAccessToken({ sub: "usr_3", role: "freelancer" });
  const response = await fetch(`http://127.0.0.1:${port}/api/search?q=designer`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.query, "designer");
  assert.ok(Array.isArray(body.data.jobs));
  assert.ok(Array.isArray(body.data.users));

  await close(server);
});
