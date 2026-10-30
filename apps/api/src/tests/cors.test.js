import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { env } from "../config/env.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("CORS allows the configured frontend origin", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { origin: env.frontendOrigin }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), env.frontendOrigin);
  });
});

test("CORS does not allow arbitrary browser origins", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { origin: "https://evil.example" }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});
