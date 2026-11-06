import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createUser, listUsers } from "../services/userService.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("listUsers returns an array that callers can mutate safely", async () => {
  await createUser({ email: "client@example.com", role: "client" });

  const snapshot = await listUsers();
  const length = snapshot.length;
  snapshot.splice(0, length);

  assert.equal(snapshot.length, 0);
  assert.equal((await listUsers()).length, length);
});

test("user route lists stored users after a snapshot is taken", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const before = (await (await fetch(`${base}/api/users`)).json()).data.length;

    const created = await fetch(`${base}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "dev@example.com", role: "freelancer" })
    });
    assert.equal(created.status, 201);

    const after = await (await fetch(`${base}/api/users`)).json();
    assert.equal(after.data.length, before + 1);
    assert.equal(after.data[after.data.length - 1].role, "freelancer");
  } finally {
    await close(server);
  }
});
