import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";
import { listUsers } from "../services/userService.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postUser(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return {
    response,
    payload: await response.json()
  };
}

test("POST /api/users accepts and normalizes a valid payload", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {
      email: "  ARCHITECT@EXAMPLE.COM ",
      fullName: " Kunal Das ",
      bio: "Systems architect",
      role: "freelancer"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "architect@example.com");
    assert.equal(payload.data.fullName, "Kunal Das");
    assert.equal(payload.data.bio, "Systems architect");
    assert.equal(payload.data.role, "freelancer");
    assert.match(payload.data.id, /^usr_\d+$/);
  });
});

test("POST /api/users rejects an invalid email", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {
      email: "not-an-email",
      fullName: "Kunal Das"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid user creation payload"
    });
  });
});

test("POST /api/users rejects a missing fullName", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {
      email: "kunal@example.com"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid user creation payload"
    });
  });
});

test("POST /api/users rejects unknown and prototype-pollution properties", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {
      email: "kunal@example.com",
      fullName: "Kunal Das",
      isAdmin: true,
      __proto__: {
        polluted: true
      }
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid user creation payload"
    });
    assert.equal({}.polluted, undefined);
  });
});

test("POST /api/users never returns or persists an unhashed password", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {
      email: "secure@example.com",
      fullName: "Secure User",
      password: "cleartext-password-must-not-persist"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal("password" in payload.data, false);
    assert.equal("passwordHash" in payload.data, false);
    assert.equal("password_hash" in payload.data, false);

    const persistedUser = (await listUsers()).find(
      (user) => user.id === payload.data.id
    );

    assert.ok(persistedUser);
    assert.equal("password" in persistedUser, false);
    assert.equal("passwordHash" in persistedUser, false);
    assert.equal("password_hash" in persistedUser, false);
  });
});
