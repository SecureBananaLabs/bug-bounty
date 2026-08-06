import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const server = createApp().listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("proposal reads stay public while creation requires a valid token", async () => {
  await withServer(async (baseUrl) => {
    const publicResponse = await fetch(`${baseUrl}/api/proposals`);
    const publicPayload = await publicResponse.json();

    assert.equal(publicResponse.status, 200);
    assert.equal(publicPayload.success, true);
    assert.ok(Array.isArray(publicPayload.data));

    const unauthenticatedResponse = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Unauthenticated proposal" }),
    });

    assert.equal(unauthenticatedResponse.status, 401);
    assert.deepEqual(await unauthenticatedResponse.json(), {
      success: false,
      message: "Unauthorized",
    });

    const invalidTokenResponse = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer invalid-token",
      },
      body: JSON.stringify({ title: "Invalid-token proposal" }),
    });

    assert.equal(invalidTokenResponse.status, 401);
    assert.deepEqual(await invalidTokenResponse.json(), {
      success: false,
      message: "Invalid token",
    });

    const title = `Authenticated proposal ${Date.now()}`;
    const authenticatedResponse = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${signAccessToken({ sub: "usr_test" })}`,
      },
      body: JSON.stringify({ title }),
    });
    const authenticatedPayload = await authenticatedResponse.json();

    assert.equal(authenticatedResponse.status, 201);
    assert.equal(authenticatedPayload.success, true);
    assert.equal(authenticatedPayload.data.title, title);
    assert.match(authenticatedPayload.data.id, /^prp_/);
  });
});
