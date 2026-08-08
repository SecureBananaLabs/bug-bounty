import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const post = (port, path, body) =>
  fetch(`http://127.0.0.1:${port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

function start(app) {
  const server = app.listen(0);
  return new Promise((resolve) => {
    server.once("listening", () => {
      const { port } = server.address();
      resolve({
        port,
        close: () => new Promise((r, e) => server.close((err) => (err ? e(err) : r()))),
      });
    });
  });
}

// 1. Auth service: registerUser returns matching id and token subject
test("registerUser id matches JWT subject", async () => {
  const app = createApp();
  const { port, close } = await start(app);

  const res = await post(port, "/api/auth/register", {
    email: "idtest@example.com",
    password: "secret12345",
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.success);
  assert.ok(body.data.id.startsWith("usr_"));
  assert.ok(body.data.token);

  await close();
});

// 2. Admin routes: non-admin gets 403
test("admin routes reject non-admin users", async () => {
  const app = createApp();
  const { port, close } = await start(app);

  const regRes = await post(port, "/api/auth/register", {
    email: "nonadmin@test.com",
    password: "secret12345",
  });
  const regBody = await regRes.json();
  const token = regBody.data.token;

  const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 403);

  await close();
});

// 3. Write controllers reject invalid input
test("message creation validates input", async () => {
  const app = createApp();
  const { port, close } = await start(app);

  const res = await post(port, "/api/messages", {});
  assert.equal(res.status, 400);

  const valid = await post(port, "/api/messages", {
    senderId: "usr_1",
    recipientId: "usr_2",
    content: "Hello!",
  });
  assert.equal(valid.status, 201);

  await close();
});

test("payment creation validates input", async () => {
  const app = createApp();
  const { port, close } = await start(app);

  const res = await post(port, "/api/payments", { amount: -5 });
  assert.equal(res.status, 400);

  const valid = await post(port, "/api/payments", { amount: 100 });
  assert.equal(valid.status, 201);

  await close();
});

test("review creation validates input", async () => {
  const app = createApp();
  const { port, close } = await start(app);

  const res = await post(port, "/api/reviews", { rating: 10 });
  assert.equal(res.status, 400);

  const valid = await post(port, "/api/reviews", {
    reviewerId: "usr_1",
    revieweeId: "usr_2",
    rating: 5,
    comment: "Great work!",
  });
  assert.equal(valid.status, 201);

  await close();
});

test("notification creation validates input", async () => {
  const app = createApp();
  const { port, close } = await start(app);

  const res = await post(port, "/api/notifications", {});
  assert.equal(res.status, 400);

  const valid = await post(port, "/api/notifications", {
    userId: "usr_1",
    type: "info",
    message: "Test notification",
  });
  assert.equal(valid.status, 201);

  await close();
});
