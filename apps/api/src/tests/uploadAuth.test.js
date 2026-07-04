import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("uploads endpoint authentication", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ id: "usr_123", role: "client" });

  await t.test("POST /api/uploads without authorization header", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "text/plain" }), "test.txt");

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: formData
    });
    assert.equal(response.status, 401);
  });

  await t.test("POST /api/uploads with invalid token", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "text/plain" }), "test.txt");

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer invalid_token"
      },
      body: formData
    });
    assert.equal(response.status, 401);
  });

  await t.test("POST /api/uploads with valid token", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "text/plain" }), "test.txt");

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });
    assert.equal(response.status, 201);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
