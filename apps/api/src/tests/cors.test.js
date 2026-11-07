import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function request(origin) {
  const app = createApp({ corsOrigins: ["https://app.example.com"] });
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await fetch(`http://127.0.0.1:${port}/health`, {
      headers: origin ? { Origin: origin } : {}
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("CORS allows configured origins", async () => {
  const response = await request("https://app.example.com");

  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "https://app.example.com"
  );
});

test("CORS does not allow unknown origins", async () => {
  const response = await request("https://untrusted.example.com");

  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("CORS permits requests without an Origin header", async () => {
  const response = await request();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});
