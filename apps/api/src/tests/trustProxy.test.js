import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(app, assertions) {
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

test("createApp trusts exactly one reverse proxy hop", async () => {
  const app = createApp();

  assert.equal(app.get("trust proxy"), 1);

  app.get("/__trust-proxy-test", (req, res) => {
    res.status(200).json({ ip: req.ip });
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/__trust-proxy-test`, {
      headers: {
        "X-Forwarded-For": "203.0.113.9, 10.0.0.5"
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ip, "10.0.0.5");
  });
});
