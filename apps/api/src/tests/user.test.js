import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

describe("POST /api/users validation and error handling", () => {
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
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it("valid user creation returns 201 and expected payload with defaults", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        username: "alice_01"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.email, "alice@example.com");
    assert.equal(body.data.username, "alice_01");
    assert.equal(body.data.role, "freelancer");
    assert.ok(body.data.id);
  });

  it("missing or blank email returns 400", async () => {
    // Missing email
    const resMissing = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "alice_01" })
    });
    const bodyMissing = await resMissing.json();
    assert.equal(resMissing.status, 400);
    assert.equal(bodyMissing.ok, false);
    assert.ok(Array.isArray(bodyMissing.issues));

    // Blank email
    const resBlank = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "   ", username: "alice_01" })
    });
    const bodyBlank = await resBlank.json();
    assert.equal(resBlank.status, 400);
    assert.equal(bodyBlank.ok, false);
    assert.ok(Array.isArray(bodyBlank.issues));
  });

  it("invalid email format returns 400", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        username: "alice_01"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.ok, false);
    assert.ok(Array.isArray(body.issues));
    assert.ok(body.issues.some((i) => i.path.includes("email")));
  });

  it("missing or blank username returns 400", async () => {
    // Missing username
    const resMissing = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice@example.com" })
    });
    const bodyMissing = await resMissing.json();
    assert.equal(resMissing.status, 400);
    assert.equal(bodyMissing.ok, false);
    assert.ok(Array.isArray(bodyMissing.issues));

    // Blank username
    const resBlank = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice@example.com", username: "   " })
    });
    const bodyBlank = await resBlank.json();
    assert.equal(resBlank.status, 400);
    assert.equal(bodyBlank.ok, false);
    assert.ok(Array.isArray(bodyBlank.issues));
  });

  it("username shorter than 3 or longer than 30 characters returns 400", async () => {
    // Too short (< 3)
    const resShort = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        username: "al"
      })
    });
    const bodyShort = await resShort.json();
    assert.equal(resShort.status, 400);
    assert.equal(bodyShort.ok, false);
    assert.ok(bodyShort.issues.some((i) => i.message.includes("at least 3 characters")));

    // Too long (> 30)
    const resLong = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        username: "a".repeat(31)
      })
    });
    const bodyLong = await resLong.json();
    assert.equal(resLong.status, 400);
    assert.equal(bodyLong.ok, false);
    assert.ok(bodyLong.issues.some((i) => i.message.includes("cannot exceed 30 characters")));
  });

  it("username with special characters (spaces, symbols) returns 400", async () => {
    const invalidUsernames = ["alice smith", "alice!smith", "alice@123", "alice-123", "alice#"];

    for (const username of invalidUsernames) {
      const res = await fetch(`${baseUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "alice@example.com",
          username
        })
      });
      const body = await res.json();
      assert.equal(res.status, 400, `Expected 400 for username: ${username}`);
      assert.equal(body.ok, false);
      assert.ok(
        body.issues.some((i) => i.message.includes("username must only contain letters, numbers, and underscores")),
        `Expected regex issue for username: ${username}`
      );
    }
  });

  it("invalid role returns 400", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        username: "alice_01",
        role: "admin"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.ok, false);
    assert.ok(body.issues.some((i) => i.path.includes("role")));
  });

  it("bio exceeding 500 characters returns 400", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        username: "alice_01",
        bio: "x".repeat(501)
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.ok, false);
    assert.ok(body.issues.some((i) => i.message.includes("cannot exceed 500 characters")));
  });

  it("injected fields stripped cleanly", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        username: "alice_01",
        role: "client",
        bio: "Valid developer bio",
        admin: true,
        permissions: ["all"],
        injectedField: "malicious_payload",
        isSuperuser: true
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.email, "alice@example.com");
    assert.equal(body.data.username, "alice_01");
    assert.equal(body.data.role, "client");
    assert.equal(body.data.bio, "Valid developer bio");
    assert.equal(body.data.admin, undefined);
    assert.equal(body.data.permissions, undefined);
    assert.equal(body.data.injectedField, undefined);
    assert.equal(body.data.isSuperuser, undefined);
  });
});
