import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/messages and GET /api/notifications should be protected", async () => {
  await withServer(async (baseUrl) => {
    const resMsg = await fetch(`${baseUrl}/api/messages`);
    assert.equal(resMsg.status, 401, `GET /api/messages should return 401, got ${resMsg.status}`);

    const resNotif = await fetch(`${baseUrl}/api/notifications`);
    assert.equal(resNotif.status, 401, `GET /api/notifications should return 401, got ${resNotif.status}`);
  });
});
