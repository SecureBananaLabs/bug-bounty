import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createCorsOptions } from "../config/cors.js";

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

function resolveOrigin(options, origin) {
  return new Promise((resolve, reject) => {
    options.origin(origin, (error, allowed) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(allowed);
    });
  });
}

test("createCorsOptions allows all origins when no allowlist is configured", async () => {
  const options = createCorsOptions();

  assert.equal(await resolveOrigin(options, "https://example.com"), true);
  assert.equal(await resolveOrigin(options), true);
});

test("createCorsOptions allows only configured browser origins", async () => {
  const options = createCorsOptions(["https://app.example.com"]);

  assert.equal(await resolveOrigin(options, "https://app.example.com"), true);
  assert.equal(await resolveOrigin(options, "https://evil.example.com"), false);
  assert.equal(await resolveOrigin(options), true);
});

test("CORS middleware reflects allowed origins and omits disallowed origins", async () => {
  await withServer(createApp({ corsOrigins: ["https://app.example.com"] }), async (baseUrl) => {
    const allowed = await fetch(`${baseUrl}/health`, {
      headers: { origin: "https://app.example.com" }
    });
    const disallowed = await fetch(`${baseUrl}/health`, {
      headers: { origin: "https://evil.example.com" }
    });

    assert.equal(allowed.status, 200);
    assert.equal(
      allowed.headers.get("access-control-allow-origin"),
      "https://app.example.com"
    );
    assert.equal(disallowed.status, 200);
    assert.equal(disallowed.headers.get("access-control-allow-origin"), null);
  });
});
