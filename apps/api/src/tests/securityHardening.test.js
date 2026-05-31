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

test("protected APIs reject unauthenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const protectedGetEndpoints = ["/api/users", "/api/jobs"];

    for (const path of protectedGetEndpoints) {
      const response = await fetch(`${baseUrl}${path}`);
      const payload = await response.json();
      assert.equal(response.status, 401);
      assert.equal(payload.message, "Unauthorized");

      const postResponse = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "attempt" }),
      });
      const postPayload = await postResponse.json();
      assert.equal(postResponse.status, 401);
      assert.equal(postPayload.message, "Unauthorized");
    }

    const searchMissing = await fetch(`${baseUrl}/api/search`);
    const searchMissingPayload = await searchMissing.json();
    assert.equal(searchMissing.status, 400);
    assert.ok(["Search query is required", "Required"].includes(searchMissingPayload.message));

    const searchLong = await fetch(`${baseUrl}/api/search?q=${"x".repeat(129)}`);
    const searchLongPayload = await searchLong.json();
    assert.equal(searchLong.status, 400);
    assert.equal(searchLongPayload.message, "Search query is too long");

    const searchValid = await fetch(`${baseUrl}/api/search?q=job`);
    const searchValidPayload = await searchValid.json();
    assert.equal(searchValid.status, 200);
    assert.equal(searchValidPayload.success, true);
    assert.equal(searchValidPayload.data.query, "job");
  });
});
