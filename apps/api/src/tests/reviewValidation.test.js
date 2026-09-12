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

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postReview(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { response, payload: await response.json() };
}

test("review creation rejects ratings outside the public 1-5 range", async () => {
  await withServer(async (baseUrl) => {
    for (const rating of [0, 6]) {
      const { response, payload } = await postReview(baseUrl, {
        targetId: "usr_target",
        rating,
        comment: "invalid rating"
      });

      assert.equal(response.status, 400);
      assert.deepEqual(payload, { success: false, message: "Invalid review payload" });
    }
  });
});

test("review creation accepts valid ratings", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postReview(baseUrl, {
      targetId: "usr_target",
      rating: 5,
      comment: "great work"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^rev_\d+$/);
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.targetId, "usr_target");
  });
});
