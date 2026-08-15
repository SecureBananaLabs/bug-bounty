import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/auth/refresh", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  await t.test("rejects missing authentication", async () => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST"
    });
    assert.equal(response.status, 401);
  });

  await t.test("rejects invalid authentication", async () => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: "Bearer badtoken123" }
    });
    assert.equal(response.status, 401);
  });

  await t.test("issues token preserving the authenticated subject and role", async () => {
    // Generate a valid mock token for a specific user
    const originalToken = signAccessToken({ sub: "usr_custom_999", role: "admin" });
    
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${originalToken}` }
    });
    assert.equal(response.status, 200);
    
    const payload = await response.json();
    assert.ok(payload.success);
    assert.ok(payload.data.token);
    
    // Decode the newly minted token payload (it is a JWT so we can just base64 decode the payload part)
    const base64Url = payload.data.token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const tokenData = JSON.parse(Buffer.from(base64, "base64").toString());
    
    assert.equal(tokenData.sub, "usr_custom_999");
    assert.equal(tokenData.role, "admin");
  });
});
