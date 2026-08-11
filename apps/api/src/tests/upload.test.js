import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

// Ensure process.loadEnvFile is called so JWT_SECRET is loaded if tests run with it,
// though during test we can mock env.jwtSecret or rely on a fallback/in-memory value.
// Wait, we need env.jwtSecret to sign and verify.
// In env.js: jwtSecret: process.env.JWT_SECRET ?? "development-secret"
// Since we are on main branch, env.js has "development-secret" as fallback, so signing works out of the box.

test("Upload Routes Authorization", async (t) => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/uploads without token returns 401", async () => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST"
    });

    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  });

  await t.test("POST /api/uploads with invalid token returns 401", async () => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer invalid-token-string"
      }
    });

    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid token");
  });

  await t.test("POST /api/uploads with valid token succeeds", async () => {
    const token = signAccessToken({ sub: "usr_test123", role: "client" });

    // Node fetch doesn't support FormData file uploads natively without FormData.
    // However, since we just want to test authMiddleware, we can send a multipart/form-data body or empty body.
    // Let's create a simple multipart boundary body or just call it, since upload.single("file") doesn't throw if file is missing,
    // it just sets req.file to undefined and calls uploadFile, which returns { status: "no-file" }.
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const body = await response.json();
    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.status, "no-file");
  });

  // Clean up server
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
