import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  return {
    url: `http://127.0.0.1:${port}`,
    stop: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function postUser(url, body) {
  const response = await fetch(`${url}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { response, payload: await response.json() };
}

test("POST /api/users creates a user from a valid payload", async () => {
  const server = await startServer();

  try {
    const { response, payload } = await postUser(server.url, {
      email: "ada@example.com",
      fullName: "Ada Lovelace",
      bio: "Mathematician",
      role: "freelancer"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^usr_/);
    assert.equal(payload.data.email, "ada@example.com");
    assert.equal(payload.data.fullName, "Ada Lovelace");
    assert.equal(payload.data.bio, "Mathematician");
    assert.equal(payload.data.role, "freelancer");
  } finally {
    await server.stop();
  }
});

test("POST /api/users rejects an invalid email", async () => {
  const server = await startServer();

  try {
    const { response, payload } = await postUser(server.url, {
      email: "not-an-email",
      fullName: "Ada Lovelace"
    });

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid user payload");
    assert.deepEqual(
      payload.errors.map((error) => error.path),
      ["email"]
    );
  } finally {
    await server.stop();
  }
});

test("POST /api/users rejects a missing fullName", async () => {
  const server = await startServer();

  try {
    const { response, payload } = await postUser(server.url, {
      email: "ada@example.com"
    });

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.deepEqual(
      payload.errors.map((error) => error.path),
      ["fullName"]
    );
  } finally {
    await server.stop();
  }
});

test("POST /api/users rejects an unknown property", async () => {
  const server = await startServer();

  try {
    const { response, payload } = await postUser(server.url, {
      email: "ada@example.com",
      fullName: "Ada Lovelace",
      isAdmin: true
    });

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.ok(
      payload.errors.some((error) => /Unrecognized key/.test(error.message)),
      `expected an unknown-key error, got ${JSON.stringify(payload.errors)}`
    );
  } finally {
    await server.stop();
  }
});

test("POST /api/users never persists an unhashed password", async () => {
  const server = await startServer();

  try {
    const { response, payload } = await postUser(server.url, {
      email: "grace@example.com",
      fullName: "Grace Hopper",
      password: "plain-text-secret"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal("password" in payload.data, false);

    const listed = await fetch(`${server.url}/api/users`);
    const store = await listed.json();
    const stored = store.data.find((user) => user.email === "grace@example.com");

    assert.ok(stored, "the created user is listed");
    assert.equal("password" in stored, false);
  } finally {
    await server.stop();
  }
});
