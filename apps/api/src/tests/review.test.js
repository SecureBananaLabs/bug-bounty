import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    return await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("POST /api/reviews with valid payload returns 201 and creates review", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetId: "user_client_101",
        reviewerId: "user_freelancer_202",
        rating: 5,
        comment: "Outstanding client with clear technical specifications and swift feedback!"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.targetId, "user_client_101");
    assert.equal(body.data.reviewerId, "user_freelancer_202");
    assert.equal(body.data.rating, 5);
    assert.ok(body.data.id.startsWith("rev_"));
  });
});

test("POST /api/reviews with minimal valid payload (no optional comment) returns 201", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetId: "user_target_303",
        reviewerId: "user_rev_404",
        rating: 4
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.targetId, "user_target_303");
    assert.equal(body.data.rating, 4);
  });
});

test("POST /api/reviews rejects missing targetId with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: "user_rev_404",
        rating: 5
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
    assert.ok(Array.isArray(body.issues));
  });
});

test("POST /api/reviews rejects missing reviewerId with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetId: "user_target_303",
        rating: 5
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});

test("POST /api/reviews rejects out-of-bounds ratings (< 1 or > 5) with 400", async () => {
  await withServer(async (baseUrl) => {
    for (const badRating of [0, -1, 6, 10]) {
      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: "user_target_303",
          reviewerId: "user_rev_404",
          rating: badRating
        })
      });

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.success, false);
      assert.equal(body.message, "Validation failed");
    }
  });
});

test("POST /api/reviews rejects non-integer rating with 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetId: "user_target_303",
        reviewerId: "user_rev_404",
        rating: 4.5
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});

test("POST /api/reviews rejects unknown extra properties (strict schema) with 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetId: "user_target_303",
        reviewerId: "user_rev_404",
        rating: 5,
        isAdmin: true,
        injectedField: "exploit"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});
