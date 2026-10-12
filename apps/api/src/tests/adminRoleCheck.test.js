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

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

test("GET /api/admin/metrics keeps answering 401 for missing or invalid tokens", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const anonymous = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);
  assert.equal(anonymous.status, 401);
  const anonymousBody = await anonymous.json();
  assert.equal(anonymousBody.message, "Unauthorized");

  const malformed = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: bearer("not-a-real-token")
  });
  assert.equal(malformed.status, 401);
  const malformedBody = await malformed.json();
  assert.equal(malformedBody.message, "Invalid token");

  await close(server);
});

test("GET /api/admin/metrics answers 403 for a non-admin token", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  for (const role of ["client", "freelancer"]) {
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: bearer(signAccessToken({ sub: `usr_${role}`, role }))
    });

    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Forbidden");
  }

  await close(server);
});

test("GET /api/admin/metrics answers an admin token", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: bearer(signAccessToken({ sub: "usr_admin", role: "admin" }))
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.openJobs, 42);
  assert.equal(body.data.activeFreelancers, 185);

  await close(server);
});
