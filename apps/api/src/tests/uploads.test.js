import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Upload routes auth and configuration enforcement", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/uploads`;

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("POST /api/uploads rejects unauthenticated requests with 401", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Unauthorized");
  });

  await t.test("POST /api/uploads rejects invalid token with 401", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid_jwt_token_456",
      },
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid token");
  });

  await t.test("POST /api/uploads allows valid authenticated request without file with 201", async () => {
    const token = signAccessToken({ id: "user_upload_1", role: "client" });
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.status, "no-file");
    assert.equal(data.data.filename, null);
  });

  await t.test("POST /api/uploads allows valid authenticated request with multipart file with 201", async () => {
    const token = signAccessToken({ id: "user_upload_2", role: "freelancer" });
    const formData = new FormData();
    const blob = new Blob(["sample document content"], { type: "text/plain" });
    formData.append("file", blob, "test-document.txt");

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.status, "uploaded");
    assert.equal(data.data.filename, "test-document.txt");
  });
});
