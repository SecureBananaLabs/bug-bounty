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

test("POST /api/reviews rejects ratings outside the supported range", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rating: 6,
        comment: "Great work",
        reviewerId: "usr_client",
        revieweeId: "usr_freelancer"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/reviews accepts valid review payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rating: 5,
        comment: "Great work",
        reviewerId: "usr_client",
        revieweeId: "usr_freelancer"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Great work");
  });
});
