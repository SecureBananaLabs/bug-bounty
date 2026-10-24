import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("refresh requires a presented token", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { success: false, message: "Invalid token" });
  } finally {
    await close(server);
  }
});

test("refresh carries the presented identity into the new token", async () => {
  const app = createApp();
  const server = await listen(app);
  const token = signAccessToken({ sub: "usr_42", role: "freelancer" });
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/refresh`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    const claims = verifyAccessToken(body.data.token);
    assert.equal(claims.sub, "usr_42");
    assert.equal(claims.role, "freelancer");
  } finally {
    await close(server);
  }
});
