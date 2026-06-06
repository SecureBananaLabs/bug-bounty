import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startServer() {
  const app = createApp();
  const server = app.listen(0);
  return new Promise((resolve) => {
    server.once("listening", () => resolve(server));
  });
}

async function register(server, body) {
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test("register accepts client role", async () => {
  const server = await startServer();
  try {
    const { status, body } = await register(server, {
      email: "client@test.com",
      password: "securepass123",
      role: "client",
    });
    assert.equal(status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.role, "client");
  } finally {
    server.close();
  }
});

test("register accepts freelancer role", async () => {
  const server = await startServer();
  try {
    const { status, body } = await register(server, {
      email: "freelancer@test.com",
      password: "securepass123",
      role: "freelancer",
    });
    assert.equal(status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.role, "freelancer");
  } finally {
    server.close();
  }
});

test("register defaults to client role when role omitted", async () => {
  const server = await startServer();
  try {
    const { status, body } = await register(server, {
      email: "default@test.com",
      password: "securepass123",
    });
    assert.equal(status, 201);
    assert.equal(body.data.role, "client");
  } finally {
    server.close();
  }
});

test("register rejects admin role", async () => {
  const server = await startServer();
  try {
    const { status, body } = await register(server, {
      email: "hacker@test.com",
      password: "securepass123",
      role: "admin",
    });
    assert.equal(status, 400);
    assert.equal(body.success, false);
  } finally {
    server.close();
  }
});

test("register rejects invalid role", async () => {
  const server = await startServer();
  try {
    const { status, body } = await register(server, {
      email: "bad@test.com",
      password: "securepass123",
      role: "superadmin",
    });
    assert.equal(status, 400);
    assert.equal(body.success, false);
  } finally {
    server.close();
  }
});

test("register rejects invalid email", async () => {
  const server = await startServer();
  try {
    const { status } = await register(server, {
      email: "not-an-email",
      password: "securepass123",
    });
    assert.equal(status, 400);
  } finally {
    server.close();
  }
});

test("register rejects short password", async () => {
  const server = await startServer();
  try {
    const { status } = await register(server, {
      email: "test@test.com",
      password: "short",
    });
    assert.equal(status, 400);
  } finally {
    server.close();
  }
});
