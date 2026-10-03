import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function runWithServer(app, fn) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    await fn(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("CORS default allowed origin http://localhost:3000", async () => {
  delete process.env.ALLOWED_ORIGINS;
  const app = createApp();

  await runWithServer(app, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "http://localhost:3000" },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:3000");
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
  });
});

test("CORS default disallowed origin http://malicious.com", async () => {
  delete process.env.ALLOWED_ORIGINS;
  const app = createApp();

  await runWithServer(app, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "http://malicious.com" },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.has("access-control-allow-origin"), false);
  });
});

test("CORS custom ALLOWED_ORIGINS env variable", async () => {
  process.env.ALLOWED_ORIGINS = "http://myallowed.com, http://another.com";
  const app = createApp();

  await runWithServer(app, async (port) => {
    const resAllowed = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "http://myallowed.com" },
    });
    assert.equal(resAllowed.status, 200);
    assert.equal(resAllowed.headers.get("access-control-allow-origin"), "http://myallowed.com");

    const resDefaultDisallowed = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "http://localhost:3000" },
    });
    assert.equal(resDefaultDisallowed.headers.has("access-control-allow-origin"), false);
  });
});

test("CORS wildcard * in ALLOWED_ORIGINS", async () => {
  process.env.ALLOWED_ORIGINS = "*";
  const app = createApp();

  await runWithServer(app, async (port) => {
    const res1 = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "http://anydomain.com" },
    });
    assert.equal(res1.status, 200);
    assert.equal(res1.headers.get("access-control-allow-origin"), "http://anydomain.com");

    const res2 = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "http://anotherdomain.com" },
    });
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get("access-control-allow-origin"), "http://anotherdomain.com");
  });
});
