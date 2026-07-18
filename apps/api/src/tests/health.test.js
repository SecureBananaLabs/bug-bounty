import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /health returns ok payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true, service: "api" });
  });
});

test("unsupported JSON charset returns API 415 payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=iso-8859-1"
      },
      body: "{}"
    });
    const payload = await response.json();

    assert.equal(response.status, 415);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported media type"
    });
  });
});

test("unsupported JSON content encoding returns API 415 payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-encoding": "compress"
      },
      body: "{}"
    });
    const payload = await response.json();

    assert.equal(response.status, 415);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported media type"
    });
  });
});
