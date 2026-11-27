import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { _resetUsers, listUsers } from "../services/userService.js";

test("User Validation & Backing Array Encapsulation", async (t) => {
  let server;
  let baseUrl;

  t.beforeEach(async () => {
    _resetUsers();
    const app = createApp();
    server = app.listen(0);
    await new Promise((res) => server.once("listening", res));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  t.afterEach(async () => {
    if (server) {
      await new Promise((res) => server.close(res));
    }
  });

  await t.test("POST /api/users rejects payload with missing or invalid email", async () => {
    const missingRes = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Jane Doe"
      })
    });
    assert.equal(missingRes.status, 400);

    const invalidRes = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Jane Doe",
        email: "not-an-email-address"
      })
    });
    assert.equal(invalidRes.status, 400);
  });

  await t.test("POST /api/users rejects payload with missing or empty name", async () => {
    const missingRes = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "jane@example.com"
      })
    });
    assert.equal(missingRes.status, 400);

    const emptyRes = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "   ",
        email: "jane@example.com"
      })
    });
    assert.equal(emptyRes.status, 400);
  });

  await t.test("POST /api/users rejects invalid role values", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Jane Doe",
        email: "jane@example.com",
        role: "admin_superuser"
      })
    });
    assert.equal(res.status, 400);
  });

  await t.test("POST /api/users accepts valid user and returns 201", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Jane Doe",
        email: "jane@example.com",
        role: "freelancer"
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.name, "Jane Doe");
    assert.equal(body.data.email, "jane@example.com");
    assert.equal(body.data.role, "freelancer");
    assert.match(body.data.id, /^usr_/);
  });

  await t.test("listUsers returns a defensive snapshot array", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "John Smith",
        email: "john@example.com"
      })
    });
    assert.equal(res.status, 201);

    const snapshot = await listUsers();
    assert.equal(snapshot.length, 1);
    snapshot.pop(); // Mutate the returned array

    const freshSnapshot = await listUsers();
    assert.equal(freshSnapshot.length, 1, "Backing store must remain uncorrupted");
  });
});
