import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/auth/login with malformed JSON returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad json"
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.ok(payload.message.toLowerCase().includes("malformed") || payload.message.toLowerCase().includes("json"));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/register with invalid payload returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.ok(payload.message.toLowerCase().includes("validation") || payload.issues);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/jobs with missing required fields returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
