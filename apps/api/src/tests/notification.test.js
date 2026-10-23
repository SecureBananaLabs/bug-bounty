import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

describe("Notifications API - POST /api/notifications", () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}/api/notifications`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      server = null;
    }
  });

  test("valid notification creation returns 201 and expected payload", async () => {
    const body = {
      userId: "user_123",
      type: "alert",
      title: "System Update",
      message: "Maintenance scheduled tonight."
    };

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.data.userId, "user_123");
    assert.equal(data.data.type, "alert");
    assert.equal(data.data.title, "System Update");
    assert.equal(data.data.message, "Maintenance scheduled tonight.");
    assert.equal(data.data.read, false);
    assert.ok(data.data.id);
  });

  test("missing or blank userId returns 400", async () => {
    for (const userId of [undefined, "", "   "]) {
      const body = {
        userId,
        type: "alert",
        title: "Test",
        message: "Hello"
      };

      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.ok, false);
      assert.ok(Array.isArray(data.issues));
    }
  });

  test("missing or blank type returns 400", async () => {
    for (const type of [undefined, "", "   "]) {
      const body = {
        userId: "user_123",
        type,
        title: "Test",
        message: "Hello"
      };

      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.ok, false);
      assert.ok(Array.isArray(data.issues));
    }
  });

  test("type exceeding 50 characters returns 400", async () => {
    const body = {
      userId: "user_123",
      type: "a".repeat(51),
      title: "Test",
      message: "Hello"
    };

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(Array.isArray(data.issues));
  });

  test("missing, blank, or whitespace-only title returns 400", async () => {
    for (const title of [undefined, "", "   "]) {
      const body = {
        userId: "user_123",
        type: "alert",
        title,
        message: "Hello"
      };

      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.ok, false);
      assert.ok(Array.isArray(data.issues));
    }
  });

  test("title exceeding 200 characters returns 400", async () => {
    const body = {
      userId: "user_123",
      type: "alert",
      title: "a".repeat(201),
      message: "Hello"
    };

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(Array.isArray(data.issues));
  });

  test("missing, blank, or whitespace-only message returns 400", async () => {
    for (const message of [undefined, "", "   "]) {
      const body = {
        userId: "user_123",
        type: "alert",
        title: "Test",
        message
      };

      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.ok, false);
      assert.ok(Array.isArray(data.issues));
    }
  });

  test("message exceeding 1000 characters returns 400", async () => {
    const body = {
      userId: "user_123",
      type: "alert",
      title: "Test",
      message: "a".repeat(1001)
    };

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(Array.isArray(data.issues));
  });

  test("injected fields stripped cleanly", async () => {
    const body = {
      userId: "user_123",
      type: "alert",
      title: "Valid Title",
      message: "Valid Message",
      injectedField: "malicious_payload",
      isAdmin: true,
      roles: ["admin", "root"]
    };

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.data.userId, "user_123");
    assert.equal(data.data.type, "alert");
    assert.equal(data.data.title, "Valid Title");
    assert.equal(data.data.message, "Valid Message");
    assert.equal(data.data.injectedField, undefined);
    assert.equal(data.data.isAdmin, undefined);
    assert.equal(data.data.roles, undefined);
  });
});
