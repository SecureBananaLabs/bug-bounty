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
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("POST /api/notifications - valid notification with explicit type returns 201 with created object", async () => {
  const payload = {
    userId: "user-123",
    title: "System Maintenance",
    message: "Scheduled maintenance in 2 hours.",
    type: "warning"
  };

  const res = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.userId, "user-123");
  assert.equal(json.data.title, "System Maintenance");
  assert.equal(json.data.message, "Scheduled maintenance in 2 hours.");
  assert.equal(json.data.type, "warning");
  assert.equal(typeof json.data.id, "string");
  assert.equal(json.data.read, false);
});

test("POST /api/notifications - valid notification without type defaults to 'info' and returns 201", async () => {
  const payload = {
    userId: "user-456",
    title: "Welcome",
    message: "Welcome to our platform!"
  };

  const res = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.userId, "user-456");
  assert.equal(json.data.title, "Welcome");
  assert.equal(json.data.message, "Welcome to our platform!");
  assert.equal(json.data.type, "info");
});

test("POST /api/notifications - missing or empty userId returns HTTP 400", async () => {
  const res1 = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Notice",
      message: "Some message"
    })
  });
  assert.equal(res1.status, 400);
  const json1 = await res1.json();
  assert.equal(json1.ok, false);
  assert.ok(json1.issues);

  const res2 = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "   ",
      title: "Notice",
      message: "Some message"
    })
  });
  assert.equal(res2.status, 400);
  const json2 = await res2.json();
  assert.equal(json2.ok, false);
});

test("POST /api/notifications - overlong userId (> 64 chars) returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "a".repeat(65),
      title: "Notice",
      message: "Some message"
    })
  });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.ok, false);
});

test("POST /api/notifications - missing or empty title returns HTTP 400", async () => {
  const res1 = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-123",
      message: "Some message"
    })
  });
  assert.equal(res1.status, 400);
  const json1 = await res1.json();
  assert.equal(json1.ok, false);

  const res2 = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-123",
      title: "   ",
      message: "Some message"
    })
  });
  assert.equal(res2.status, 400);
  const json2 = await res2.json();
  assert.equal(json2.ok, false);
});

test("POST /api/notifications - overlong title (> 120 chars) returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-123",
      title: "t".repeat(121),
      message: "Some message"
    })
  });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.ok, false);
});

test("POST /api/notifications - missing or empty message returns HTTP 400", async () => {
  const res1 = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-123",
      title: "Notice"
    })
  });
  assert.equal(res1.status, 400);
  const json1 = await res1.json();
  assert.equal(json1.ok, false);

  const res2 = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-123",
      title: "Notice",
      message: "   "
    })
  });
  assert.equal(res2.status, 400);
  const json2 = await res2.json();
  assert.equal(json2.ok, false);
});

test("POST /api/notifications - overlong message (> 1000 chars) returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-123",
      title: "Notice",
      message: "m".repeat(1001)
    })
  });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.ok, false);
});

test("POST /api/notifications - invalid type enum returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-123",
      title: "Notice",
      message: "Some message",
      type: "critical"
    })
  });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.ok, false);
});

test("GET /api/notifications returns 200 with array of notifications", async () => {
  const res = await fetch(`${baseUrl}/api/notifications`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length >= 2);
});
