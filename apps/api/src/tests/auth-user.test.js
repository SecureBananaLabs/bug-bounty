import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function decodeJwtPayload(token) {
  const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

test("user creation validates payloads and keeps server-owned ids", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const emptyResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  assert.equal(emptyResponse.status, 400);

  const badIdResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "usr_client_controlled",
      email: "jane@example.com",
      fullName: "Jane Doe",
      role: "client"
    })
  });
  assert.equal(badIdResponse.status, 400);

  const validResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "jane@example.com",
      fullName: "Jane Doe",
      role: "client"
    })
  });
  const validPayload = await validResponse.json();

  assert.equal(validResponse.status, 201);
  assert.equal(validPayload.data.email, "jane@example.com");
  assert.match(validPayload.data.id, /^usr_/);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("auth refresh requires auth and preserves the requester subject", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const unauthenticated = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST"
  });
  assert.equal(unauthenticated.status, 401);

  const token = signAccessToken({ sub: "usr_abc123", role: "freelancer" });
  for (const scheme of ["Bearer", "bearer", "BEARER"]) {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `${scheme} ${token}` }
    });
    const payload = await response.json();
    const decoded = decodeJwtPayload(payload.data.token);

    assert.equal(response.status, 200);
    assert.equal(decoded.sub, "usr_abc123");
    assert.equal(decoded.role, "freelancer");
  }

  const invalidScheme = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Token ${token}` }
  });
  assert.equal(invalidScheme.status, 401);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
