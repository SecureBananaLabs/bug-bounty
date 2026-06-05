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

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function getSearch(baseUrl, queryString) {
  const response = await fetch(`${baseUrl}/api/search${queryString}`);
  return { response, payload: await response.json() };
}

test("GET /api/search rejects repeated q parameters", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await getSearch(baseUrl, "?q=hello&q=world");

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Search query must be a single value" });
  });
});

test("GET /api/search trims and caps q before searching", async () => {
  await withServer(async (baseUrl) => {
    const longQuery = `${"a".repeat(205)}   `;
    const { response, payload } = await getSearch(baseUrl, `?q=%20%20${longQuery}`);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query.length, 200);
    assert.equal(payload.data.query, "a".repeat(200));
  });
});
