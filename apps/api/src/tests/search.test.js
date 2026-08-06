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

async function getSearchQuery(baseUrl, queryString) {
  const response = await fetch(`${baseUrl}/api/search${queryString}`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  return payload.data.query;
}

test("GET /api/search normalizes query parameter shape", async () => {
  await withServer(async (baseUrl) => {
    assert.equal(await getSearchQuery(baseUrl, "?q=alpha"), "alpha");
    assert.equal(await getSearchQuery(baseUrl, "?q=alpha&q=beta"), "alpha");
    assert.equal(await getSearchQuery(baseUrl, "?q[x]=beta"), "");
    assert.equal(await getSearchQuery(baseUrl, ""), "");
  });
});
