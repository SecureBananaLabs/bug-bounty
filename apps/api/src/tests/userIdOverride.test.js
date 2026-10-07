import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("createUser keeps the generated id over a client supplied one", async () => {
  const app = createApp();
  const server = await listen(app);
  const token = signAccessToken({ sub: "usr_1", role: "client" });
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/users`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ id: "squatter", email: "ana@example.test", role: "freelancer" })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.id.startsWith("usr_"));
    assert.notEqual(body.data.id, "squatter");
    assert.equal(body.data.email, "ana@example.test");
    assert.equal(body.data.role, "freelancer");

    const listed = await fetch(`http://127.0.0.1:${server.address().port}/api/users`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const listedBody = await listed.json();
    assert.equal(listedBody.data.at(-1).id, body.data.id);
  } finally {
    await close(server);
  }
});
