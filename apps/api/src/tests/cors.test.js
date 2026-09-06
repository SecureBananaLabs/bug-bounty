import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

// Helper to start/stop server with a specific ALLOWED_ORIGINS env value
async function withServer(env, fn) {
  const prev = process.env.ALLOWED_ORIGINS;
  process.env.ALLOWED_ORIGINS = env;
  const app = createApp();
  const server = app.listen(0);
  await new Promise((res, rej) => {
    server.once("listening", res);
    server.once("error", rej);
  });
  try {
    await fn(server.address().port);
  } finally {
    process.env.ALLOWED_ORIGINS = prev;
    await new Promise((res, rej) => server.close((e) => (e ? rej(e) : res())));
  }
}

test("allowed origin receives Access-Control-Allow-Origin header", async () => {
  await withServer("http://allowed.example.com", async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "http://allowed.example.com" },
    });
    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://allowed.example.com"
    );
  });
});

test("unlisted origin does not receive Access-Control-Allow-Origin header", async () => {
  await withServer("http://allowed.example.com", async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "http://evil.example.com" },
    });
    // Either a CORS error response or no ACAO header for the bad origin
    const acaoHeader = response.headers.get("access-control-allow-origin");
    assert.notEqual(acaoHeader, "http://evil.example.com");
  });
});

test("health endpoint works with no Origin header", async () => {
  await withServer("http://allowed.example.com", async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true, service: "api" });
  });
});
