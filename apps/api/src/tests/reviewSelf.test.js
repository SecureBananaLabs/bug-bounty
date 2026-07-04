import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/reviews self-review prevention", async (t) => {
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
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("rejects self-review with 400", async () => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reviewerId: "usr_same",
        revieweeId: "usr_same",
        rating: 5,
        comment: "Self review boost"
      })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("accepts review between different users with 201", async () => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reviewerId: "usr_123",
        revieweeId: "usr_456",
        rating: 5,
        comment: "Excellent work"
      })
    });
    assert.equal(res.status, 201);
  });
});
