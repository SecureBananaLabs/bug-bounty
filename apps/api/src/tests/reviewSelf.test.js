import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/reviews self-review check", async (t) => {
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

  await t.test("allows valid review between different users", async () => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewerId: "usr_1", revieweeId: "usr_2", rating: 5, comment: "awesome work" })
    });
    assert.equal(res.status, 201);
  });

  await t.test("rejects self-reviews", async () => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewerId: "usr_1", revieweeId: "usr_1", rating: 5, comment: "self boost" })
    });
    assert.equal(res.status, 400);
  });
});
