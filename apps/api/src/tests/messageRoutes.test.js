import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function listen() {
  const server = createApp().listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function authHeaders(userId) {
  return {
    Authorization: `Bearer ${signAccessToken({ sub: userId, role: "client" })}`
  };
}

test("message routes require authentication", async () => {
  const { server, baseUrl } = await listen();

  try {
    const listResponse = await fetch(`${baseUrl}/api/messages`);
    assert.equal(listResponse.status, 401);

    const createResponse = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_public",
        receiverId: "usr_target",
        content: "hello"
      })
    });
    assert.equal(createResponse.status, 401);
  } finally {
    await close(server);
  }
});

test("message routes use authenticated sender and return only participant messages", async () => {
  const { server, baseUrl } = await listen();
  const alice = `usr_alice_${Date.now()}`;
  const bob = `usr_bob_${Date.now()}`;
  const carol = `usr_carol_${Date.now()}`;

  try {
    const aliceCreate = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(alice)
      },
      body: JSON.stringify({
        senderId: "usr_spoofed",
        receiverId: bob,
        content: "alice to bob"
      })
    });
    const alicePayload = await aliceCreate.json();

    assert.equal(aliceCreate.status, 201);
    assert.equal(alicePayload.data.senderId, alice);
    assert.equal(alicePayload.data.receiverId, bob);

    const carolCreate = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(carol)
      },
      body: JSON.stringify({
        senderId: "usr_spoofed",
        receiverId: bob,
        content: "carol to bob"
      })
    });
    const carolPayload = await carolCreate.json();

    assert.equal(carolCreate.status, 201);
    assert.equal(carolPayload.data.senderId, carol);

    const aliceList = await fetch(`${baseUrl}/api/messages`, {
      headers: authHeaders(alice)
    });
    const aliceListPayload = await aliceList.json();

    assert.equal(aliceList.status, 200);
    assert.equal(aliceListPayload.data.length, 1);
    assert.equal(aliceListPayload.data[0].senderId, alice);
    assert.equal(aliceListPayload.data[0].receiverId, bob);

    const bobList = await fetch(`${baseUrl}/api/messages`, {
      headers: authHeaders(bob)
    });
    const bobListPayload = await bobList.json();

    assert.equal(bobList.status, 200);
    assert.equal(bobListPayload.data.length, 2);
    assert.deepEqual(
      bobListPayload.data.map((message) => message.senderId).sort(),
      [alice, carol].sort()
    );
  } finally {
    await close(server);
  }
});
