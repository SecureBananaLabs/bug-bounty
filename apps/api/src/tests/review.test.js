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

test("GET /api/reviews returns 200 and list", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/reviews`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  });
});

test("GET /api/reviews/:id with non-existent id returns 404", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/reviews/non_existent_rev`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Review not found");
  });
});

test("POST /api/reviews creates review and GET /api/reviews/:id retrieves it", async () => {
  await withServer(async (baseUrl) => {
    const createRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewerId: "usr_client", revieweeId: "usr_freelancer", rating: 5, comment: "Exceptional code quality and timely delivery!" }),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.equal(created.success, true);
    assert.ok(created.data.id);
    assert.equal(created.data.rating, 5);

    const getRes = await fetch(`${baseUrl}/api/reviews/${created.data.id}`);
    assert.equal(getRes.status, 200);
    const retrieved = await getRes.json();
    assert.equal(retrieved.success, true);
    assert.equal(retrieved.data.id, created.data.id);
    assert.equal(retrieved.data.comment, "Exceptional code quality and timely delivery!");
  });
});
