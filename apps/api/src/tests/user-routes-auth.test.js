import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("user routes reject unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const getResponse = await fetch(`${baseUrl}/api/users`);
    const getPayload = await getResponse.json();

    assert.equal(getResponse.status, 401);
    assert.deepEqual(getPayload, { success: false, message: "Unauthorized" });

    const postResponse = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" })
    });
    const postPayload = await postResponse.json();

    assert.equal(postResponse.status, 401);
    assert.deepEqual(postPayload, { success: false, message: "Unauthorized" });
  });
});

test("user routes accept a valid bearer token", async () => {
  const token = signAccessToken({ sub: "usr_test", role: "client" });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(response.status, 200);
  });
});
