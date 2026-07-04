import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("proposal endpoint authentication", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ id: "usr_123", role: "client" });

  await t.test("GET /api/proposals without authorization header", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "GET"
    });
    assert.equal(response.status, 401);
  });

  await t.test("GET /api/proposals with invalid token", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer invalid_token"
      }
    });
    assert.equal(response.status, 401);
  });

  await t.test("GET /api/proposals with valid token", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    assert.equal(response.status, 200);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
