import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const post = async (path, body) => {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => null);
    return { status: response.status, payload };
  };

  try {
    return await run({ post });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/login returns a token for the authenticated subject and role", async () => {
  await withServer(async ({ post }) => {
    const email = `alice+${Date.now()}@example.com`;
    const password = "correct-horse-battery-staple";

    const registered = await post("/api/auth/register", {
      email,
      password,
      role: "freelancer"
    });
    assert.equal(registered.status, 201);
    const { id } = registered.payload.data;

    const loggedIn = await post("/api/auth/login", { email, password });
    assert.equal(loggedIn.status, 200);
    assert.equal(loggedIn.payload.success, true);

    const claims = verifyAccessToken(loggedIn.payload.data.token);
    assert.equal(claims.sub, id);
    assert.equal(claims.role, "freelancer");
  });
});

test("POST /api/auth/login rejects an unknown email with 401", async () => {
  await withServer(async ({ post }) => {
    const response = await post("/api/auth/login", {
      email: `nobody+${Date.now()}@example.com`,
      password: "any-password-value"
    });

    assert.equal(response.status, 401);
    assert.equal(response.payload.success, false);
    assert.match(response.payload.message, /Invalid credentials/i);
    assert.equal(response.payload.data, undefined);
  });
});

test("POST /api/auth/login rejects a wrong password with 401", async () => {
  await withServer(async ({ post }) => {
    const email = `bob+${Date.now()}@example.com`;
    const password = "the-real-password";

    await post("/api/auth/register", { email, password, role: "client" });
    const response = await post("/api/auth/login", {
      email,
      password: "not-the-password"
    });

    assert.equal(response.status, 401);
    assert.equal(response.payload.success, false);
    assert.match(response.payload.message, /Invalid credentials/i);
    assert.equal(response.payload.data, undefined);
  });
});
