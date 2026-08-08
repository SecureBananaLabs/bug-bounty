import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => {
      resolve({
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        server
      });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/users accepts valid user payloads", async () => {
  const { baseUrl, server } = await listen(createApp());

  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "maya@example.com",
      name: "Maya",
      role: "freelancer"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.email, "maya@example.com");
  assert.equal(payload.data.name, "Maya");
  assert.equal(payload.data.role, "freelancer");

  await close(server);
});

test("POST /api/users rejects invalid emails", async () => {
  const { baseUrl, server } = await listen(createApp());

  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "not-an-email",
      name: "Maya"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);

  await close(server);
});

test("POST /api/users rejects admin self-assignment", async () => {
  const { baseUrl, server } = await listen(createApp());

  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "maya@example.com",
      name: "Maya",
      role: "admin"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);

  await close(server);
});
