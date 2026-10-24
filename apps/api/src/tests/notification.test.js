import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

let server;
let baseUrl;

before(async () => {
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("GET /api/notifications returns 200", async () => {
  const res = await fetch(`${baseUrl}/api/notifications`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
});

test("POST /api/notifications with valid payload returns 201 and created notification", async () => {
  const payload = {
    userId: "usr_12345",
    title: "Job Offer Received",
    message: "You have been invited to apply for the backend engineer role.",
    type: "info"
  };

  const res = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.userId, payload.userId);
  assert.equal(body.data.title, payload.title);
  assert.equal(body.data.message, payload.message);
  assert.equal(body.data.type, payload.type);
  assert.ok(body.data.id);
});

test("POST /api/notifications with missing userId returns 400", async () => {
  const payload = {
    title: "No User",
    message: "Missing userId field"
  };

  const res = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Validation failed");
  assert.ok(Array.isArray(body.errors));
  assert.ok(body.errors.some((e) => e.path.includes("userId")));
});

test("POST /api/notifications with empty or missing title returns 400", async () => {
  const resMissing = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "usr_123",
      message: "Valid message content"
    })
  });
  const bodyMissing = await resMissing.json();
  assert.equal(resMissing.status, 400);
  assert.equal(bodyMissing.success, false);
  assert.ok(bodyMissing.errors.some((e) => e.path.includes("title")));

  const resEmpty = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "usr_123",
      title: "",
      message: "Valid message content"
    })
  });
  const bodyEmpty = await resEmpty.json();
  assert.equal(resEmpty.status, 400);
  assert.equal(bodyEmpty.success, false);
  assert.ok(bodyEmpty.errors.some((e) => e.path.includes("title")));
});

test("POST /api/notifications with excessive title length (>120) returns 400", async () => {
  const longTitle = "a".repeat(121);
  const res = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "usr_123",
      title: longTitle,
      message: "Valid message content"
    })
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Validation failed");
  assert.ok(body.errors.some((e) => e.path.includes("title")));
});

test("POST /api/notifications with excessive message length (>1000) returns 400", async () => {
  const longMessage = "m".repeat(1001);
  const res = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "usr_123",
      title: "Valid Title",
      message: longMessage
    })
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Validation failed");
  assert.ok(body.errors.some((e) => e.path.includes("message")));
});

test("POST /api/notifications with invalid type enum returns 400", async () => {
  const res = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "usr_123",
      title: "Valid Title",
      message: "Valid message",
      type: "invalid_type"
    })
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Validation failed");
  assert.ok(body.errors.some((e) => e.path.includes("type")));
});
