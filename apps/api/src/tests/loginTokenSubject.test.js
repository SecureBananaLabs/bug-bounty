import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

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

async function login(port, email) {
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "hunterhunter" })
  });

  return response.json();
}

test("POST /api/auth/login signs a token for the account that logged in", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const payload = await login(port, "ada@example.com");

  assert.equal(payload.success, true);

  const claims = verifyAccessToken(payload.data.token);

  assert.equal(claims.sub, "ada@example.com");

  await close(server);
});

test("a second login replaces the subject instead of reusing a fixed one", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const first = await login(port, "ada@example.com");
  const second = await login(port, "grace@example.com");

  const firstClaims = verifyAccessToken(first.data.token);
  const secondClaims = verifyAccessToken(second.data.token);

  assert.equal(firstClaims.sub, "ada@example.com");
  assert.equal(secondClaims.sub, "grace@example.com");

  await close(server);
});
