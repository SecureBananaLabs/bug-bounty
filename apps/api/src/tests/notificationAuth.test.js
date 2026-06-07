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

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("notification routes reject unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const listResponse = await fetch(`${baseUrl}/api/notifications`);
    const createResponse = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Invoice paid" })
    });

    assert.equal(listResponse.status, 401);
    assert.equal(createResponse.status, 401);
  });
});

test("notification routes accept valid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_notifications", role: "client" });
    const headers = {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    };

    const createResponse = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title: "Proposal update" })
    });
    const created = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(created.success, true);
    assert.equal(created.data.title, "Proposal update");

    const listResponse = await fetch(`${baseUrl}/api/notifications`, { headers });
    const listed = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listed.success, true);
    assert.equal(
      listed.data.some((notification) => notification.id === created.data.id),
      true
    );
  });
});
