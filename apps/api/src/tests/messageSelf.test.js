import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/messages self-direction check", async (t) => {
  process.env.JWT_SECRET = "testsecret";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("allows valid message between different users", async () => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: "usr_1", receiverId: "usr_2", body: "hello distinct user" })
    });
    assert.equal(res.status, 201);
  });

  await t.test("rejects self-directed messages", async () => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: "usr_1", receiverId: "usr_1", body: "hello self" })
    });
    assert.equal(res.status, 400);
  });
});
