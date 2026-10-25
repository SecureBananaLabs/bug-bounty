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

test("auth middleware accepts lowercase bearer scheme", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_existing", role: "admin" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `bearer ${token}` }
    });

    assert.equal(response.status, 200);
  });
});

test("auth middleware tolerates extra bearer whitespace", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_existing", role: "admin" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `BeArEr   ${token}  ` }
    });

    assert.equal(response.status, 200);
  });
});

test("auth middleware rejects missing bearer token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: "bearer   " }
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });
});
