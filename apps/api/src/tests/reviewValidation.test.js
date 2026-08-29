import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/reviews input validation regression test suite", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/reviews`;

  await t.test("Success: accepts a valid review payload", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: 5,
        comment: "Excellent service!",
        reviewerId: "usr_client_1",
        revieweeId: "usr_freelancer_1"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.rating, 5);
  });

  await t.test("Fail: rejects rating below 1", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: 0,
        comment: "Bad service",
        reviewerId: "usr_client_1",
        revieweeId: "usr_freelancer_1"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /greater than or equal to 1/i);
  });

  await t.test("Fail: rejects rating above 5", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: 6,
        comment: "Superb!",
        reviewerId: "usr_client_1",
        revieweeId: "usr_freelancer_1"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /less than or equal to 5/i);
  });

  await t.test("Fail: rejects empty comment", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: 4,
        comment: "",
        reviewerId: "usr_client_1",
        revieweeId: "usr_freelancer_1"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
