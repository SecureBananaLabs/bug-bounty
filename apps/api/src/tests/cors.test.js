import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("CORS allows trusted local frontend origins", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { origin: "http://localhost:3000" }
    });

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:3000"
    );
    assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  });
});

test("CORS does not allow untrusted browser origins", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { origin: "https://evil.example" }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});

test("CORS keeps no-origin service requests working", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true, service: "api" });
  });
});
