import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { registerSchema } from "../validators/auth.js";

function makeRequest(app, method, path, body) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => {
      const { port } = server.address();
      fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      })
        .then(r => r.json().then(data => ({ status: r.status, data })))
        .then(result => {
          server.close(() => resolve(result));
        })
        .catch(err => {
          server.close();
          reject(err);
        });
    });
    server.once("error", reject);
  });
}

test("registerSchema rejects missing fullName", () => {
  assert.throws(
    () => registerSchema.parse({ email: "a@b.com", password: "password123" }),
    /Required/i
  );
});

test("registerSchema accepts valid fullName", () => {
  const result = registerSchema.parse({
    email: "alice@example.com",
    password: "password123",
    fullName: "Alice Smith"
  });
  assert.equal(result.fullName, "Alice Smith");
});

test("POST /api/auth/register returns fullName in payload", async () => {
  const app = createApp();
  const result = await makeRequest(app, "POST", "/api/auth/register", {
    email: "alice@example.com",
    password: "password123",
    fullName: "Alice Smith",
    role: "client"
  });

  assert.equal(result.status, 201);
  assert.equal(result.data.success, true);
  assert.equal(result.data.data.fullName, "Alice Smith");
  assert.equal(result.data.data.email, "alice@example.com");
  assert.equal(result.data.data.role, "client");
  assert.ok(result.data.data.token);
});
