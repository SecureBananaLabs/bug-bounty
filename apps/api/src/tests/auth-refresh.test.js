import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("refresh endpoint requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const unauthenticated = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST"
    });
    assert.equal(unauthenticated.status, 401);

    const token = signAccessToken({ sub: "usr_existing", role: "client" });
    const authenticated = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await authenticated.json();

    assert.equal(authenticated.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.token, "string");
  });
});
