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

test("creation routes require authentication while list routes stay public", async () => {
  await withServer(async (baseUrl) => {
    for (const route of ["/api/reviews", "/api/messages", "/api/proposals"]) {
      const listResponse = await fetch(`${baseUrl}${route}`);
      assert.equal(listResponse.status, 200);

      const createResponse = await fetch(`${baseUrl}${route}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "unauthenticated content" })
      });
      const payload = await createResponse.json();

      assert.equal(createResponse.status, 401);
      assert.equal(payload.message, "Unauthorized");
    }
  });
});
