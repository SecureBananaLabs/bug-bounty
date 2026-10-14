import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/uploads auth enforcement regression test suite", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/uploads`;

  await t.test("Fail: returns 401 when request lacks authorization header", async () => {
    const response = await fetch(baseUrl, {
      method: "POST"
    });

    const payload = await response.json();
    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.match(payload.message, /unauthorized/i);
  });

  await t.test("Fail: returns 401 when authorization token is invalid", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Authorization": "Bearer invalid-token-value"
      }
    });

    const payload = await response.json();
    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.match(payload.message, /invalid token/i);
  });

  await t.test("Success: allows upload (returns 201) when presenting a valid token", async () => {
    const validToken = signAccessToken({ sub: "usr_test_uploader", role: "client" });
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${validToken}`
      }
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.status, "no-file"); // MULTER processes okay, no file sent
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
