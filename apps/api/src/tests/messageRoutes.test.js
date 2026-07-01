import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const messagePayload = {
  recipientId: "usr_freelancer",
  body: "Can we discuss the project timeline?"
};

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

test("message routes reject unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const getResponse = await fetch(`${baseUrl}/api/messages`);
    const getPayload = await getResponse.json();

    assert.equal(getResponse.status, 401);
    assert.equal(getPayload.success, false);
    assert.equal(getPayload.message, "Unauthorized");

    const postResponse = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messagePayload)
    });
    const postPayload = await postResponse.json();

    assert.equal(postResponse.status, 401);
    assert.equal(postPayload.success, false);
    assert.equal(postPayload.message, "Unauthorized");
  });
});

test("message routes allow authenticated send and list requests", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };

    const postResponse = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify(messagePayload)
    });
    const postPayload = await postResponse.json();

    assert.equal(postResponse.status, 201);
    assert.equal(postPayload.success, true);
    assert.equal(postPayload.data.body, messagePayload.body);
    assert.ok(postPayload.data.id);

    const getResponse = await fetch(`${baseUrl}/api/messages`, { headers });
    const getPayload = await getResponse.json();

    assert.equal(getResponse.status, 200);
    assert.equal(getPayload.success, true);
    assert.ok(getPayload.data.some((message) => message.id === postPayload.data.id));
  });
});
