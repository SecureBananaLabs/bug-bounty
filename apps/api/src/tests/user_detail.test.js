import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { _resetUsers, listUsers } from "../services/userService.js";

test("User Detail By ID & Array Encapsulation", async (t) => {
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

  await t.test("GET /api/users/:id returns 404 when user does not exist", async () => {
    const res = await fetch(`${baseUrl}/api/users/non_existent_usr`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "User not found");
  });

  await t.test("POST /api/users creates a user and GET /api/users/:id resolves it", async () => {
    const createRes = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice Developer",
        email: "alice@example.com",
        role: "freelancer"
      })
    });

    assert.equal(createRes.status, 201);
    const createBody = await createRes.json();
    assert.equal(createBody.success, true);
    const userId = createBody.data.id;
    assert.ok(userId);
    assert.match(userId, /^usr_/);

    // Resolve by ID
    const getRes = await fetch(`${baseUrl}/api/users/${userId}`);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.success, true);
    assert.equal(getBody.data.id, userId);
    assert.equal(getBody.data.name, "Alice Developer");
    assert.equal(getBody.data.email, "alice@example.com");
    assert.equal(getBody.data.role, "freelancer");
  });

  await t.test("listUsers returns a defensive snapshot array", async () => {
    const createRes = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bob Client",
        email: "bob@example.com",
        role: "client"
      })
    });
    assert.equal(createRes.status, 201);

    const snapshot = await listUsers();
    assert.equal(snapshot.length, 1);
    snapshot.pop(); // Mutate the returned array

    const freshSnapshot = await listUsers();
    assert.equal(freshSnapshot.length, 1, "Backing store must remain uncorrupted");
  });
});
