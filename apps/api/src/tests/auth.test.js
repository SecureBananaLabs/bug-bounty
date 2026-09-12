import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

// The forged subject the pre-fix implementation hard-coded for every caller.
const LEGACY_HARD_CODED_SUBJECT = "usr_existing";

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

function decodePayload(token) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
}

test("POST /api/auth/login returns a token for the authenticated subject and role", async () => {
  await withServer(async ({ post }) => {
    const email = `alice+${Date.now()}@example.com`;
    const password = "correct-horse-battery-staple";

    const registered = await post("/api/auth/register", { email, password, role: "freelancer" });
    assert.equal(registered.status, 201);
    const { id } = registered.payload.data;

    const loggedIn = await post("/api/auth/login", { email, password });
    assert.equal(loggedIn.status, 200);

    const { token } = loggedIn.payload.data;
    const payload = decodePayload(token);

    assert.equal(payload.sub, id, "token subject must be the authenticated user's id");
    assert.equal(payload.role, "freelancer", "token must carry the user's own role");
    assert.notEqual(payload.sub, LEGACY_HARD_CODED_SUBJECT);
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
    assert.equal(response.payload.data, undefined, "no token may be issued");
  });
});

test("POST /api/auth/login rejects a wrong password with 401", async () => {
  await withServer(async ({ post }) => {
    const email = `bob+${Date.now()}@example.com`;
    const password = "the-real-password";

    await post("/api/auth/register", { email, password, role: "client" });
    const response = await post("/api/auth/login", { email, password: "not-the-password" });

    assert.equal(response.status, 401);
    assert.equal(response.payload.success, false);
    assert.match(response.payload.message, /Invalid credentials/i);
    assert.equal(response.payload.data, undefined, "no token may be issued");
  });
});

test("POST /api/auth/login rejects a malformed body with 400", async () => {
  await withServer(async ({ post }) => {
    const response = await post("/api/auth/login", { email: "not-an-email" });

    assert.equal(response.status, 400);
    assert.equal(response.payload.success, false);
    assert.match(response.payload.message, /Validation failed/i);
    assert.equal(response.payload.data, undefined, "no token may be issued");
  });
});
