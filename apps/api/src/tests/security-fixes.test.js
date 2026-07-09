import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function createToken(payload) {
  return signAccessToken(payload);
}

async function createTestServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return { server, port };
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

// =============================================
// Admin metrics role guard tests (Issue #3936)
// =============================================

test("GET /api/admin/metrics without token returns 401", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);
    assert.equal(res.status, 401);
  } finally {
    await closeServer(server);
  }
});

test("GET /api/admin/metrics with non-admin token returns 403", async () => {
  const { server, port } = await createTestServer();
  try {
    const token = createToken({ sub: "usr_123", role: "client" });
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.message, "Forbidden");
  } finally {
    await closeServer(server);
  }
});

test("GET /api/admin/metrics with freelancer token returns 403", async () => {
  const { server, port } = await createTestServer();
  try {
    const token = createToken({ sub: "usr_456", role: "freelancer" });
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 403);
  } finally {
    await closeServer(server);
  }
});

test("GET /api/admin/metrics with admin token returns 200", async () => {
  const { server, port } = await createTestServer();
  try {
    const token = createToken({ sub: "usr_789", role: "admin" });
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
  } finally {
    await closeServer(server);
  }
});

test("GET /api/admin/metrics with invalid token returns 401", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { Authorization: "Bearer invalid-token" },
    });
    assert.equal(res.status, 401);
  } finally {
    await closeServer(server);
  }
});

// =============================================
// Upload file size limit tests (Issue #3758)
// =============================================

test("POST /api/uploads with file exceeding size limit returns 400", async () => {
  const { server, port } = await createTestServer();
  try {
    // Create a buffer larger than 5MB
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
    const formData = new FormData();
    formData.append("file", new Blob([largeBuffer]), "large-file.jpg");

    const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: formData,
    });
    // Should be rejected - either 400 or 413
    assert.ok(res.status === 400 || res.status === 413, `Expected 400 or 413, got ${res.status}`);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/uploads with disallowed file type returns 400", async () => {
  const { server, port } = await createTestServer();
  try {
    const formData = new FormData();
    formData.append("file", new Blob(["evil content"]), "malware.exe");

    const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: formData,
    });
    assert.equal(res.status, 400);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/uploads with no file returns 400", async () => {
  const { server, port } = await createTestServer();
  try {
    const formData = new FormData();
    const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: formData,
    });
    assert.equal(res.status, 400);
  } finally {
    await closeServer(server);
  }
});

// =============================================
// PORT validation tests (Issue #3904)
// =============================================

test("env.port rejects PORT=0", async () => {
  const originalPort = process.env.PORT;
  process.env.PORT = "0";
  try {
    // Dynamic import to pick up new env
    const mod = await import(`../config/env.js?update=${Date.now()}`);
    // If it didn't throw, the value should be valid
    assert.ok(mod.env.port >= 1024, `port should be >= 1024, got ${mod.env.port}`);
  } catch (e) {
    // Expected: validation error
    assert.ok(e.message.includes("Invalid PORT"));
  } finally {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  }
});

test("env.port rejects negative PORT", async () => {
  const originalPort = process.env.PORT;
  process.env.PORT = "-1";
  try {
    const mod = await import(`../config/env.js?update=${Date.now()}`);
    assert.fail("Should have thrown");
  } catch (e) {
    assert.ok(e.message.includes("Invalid PORT"));
  } finally {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  }
});

test("env.port rejects PORT below 1024", async () => {
  const originalPort = process.env.PORT;
  process.env.PORT = "80";
  try {
    const mod = await import(`../config/env.js?update=${Date.now()}`);
    assert.fail("Should have thrown");
  } catch (e) {
    assert.ok(e.message.includes("Invalid PORT"));
  } finally {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  }
});

test("env.port accepts valid PORT", async () => {
  const originalPort = process.env.PORT;
  process.env.PORT = "4000";
  try {
    const mod = await import(`../config/env.js?update=${Date.now()}`);
    assert.equal(mod.env.port, 4000);
  } finally {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  }
});
