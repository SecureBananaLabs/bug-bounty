import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/reviews validates rating bounds and required fields", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/reviews`;

  await t.test("rejects rating below 1 with 400 Bad Request", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUserId: "usr_freelancer_1",
        rating: 0,
        comment: "Terrible experience"
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("rejects rating exceeding 5 with 400 Bad Request", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUserId: "usr_freelancer_1",
        rating: 6,
        comment: "Super awesome"
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("rejects too short comment with 400 Bad Request", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUserId: "usr_freelancer_1",
        rating: 5,
        comment: "ok"
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("accepts valid review payload with 201 Created", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUserId: "usr_freelancer_1",
        rating: 5,
        comment: "Outstanding delivery and communication!"
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.rating, 5);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
