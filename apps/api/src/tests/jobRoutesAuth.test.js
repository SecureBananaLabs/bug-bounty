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

test("GET /api/jobs requires a bearer token", async () => {
  const server = await listen(createApp());
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const anonymous = await fetch(`${base}/api/jobs`);
    assert.equal(anonymous.status, 401);
    assert.deepEqual(await anonymous.json(), { success: false, message: "Unauthorized" });

    const token = signAccessToken({ sub: "usr_1", role: "client" });
    const authorized = await fetch(`${base}/api/jobs`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(authorized.status, 200);
    assert.deepEqual(await authorized.json(), { success: true, data: [] });
  } finally {
    await close(server);
  }
});

test("POST /api/jobs rejects an invalid token", async () => {
  const server = await listen(createApp());
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await fetch(`${base}/api/jobs`, {
      method: "POST",
      headers: { authorization: "Bearer not-a-real-token", "content-type": "application/json" },
      body: JSON.stringify({
        title: "Build a landing page",
        description: "Needs copy and styling",
        budgetMin: 100,
        budgetMax: 400,
        categoryId: "cat_web"
      })
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { success: false, message: "Invalid token" });
  } finally {
    await close(server);
  }
});
