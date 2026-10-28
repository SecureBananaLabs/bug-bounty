import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { buildCorsOptions } from "../config/cors.js";

async function withServer(app, run) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("allowlisted origin receives CORS approval", async () => {
  const app = createApp({ corsOrigins: ["https://app.example.com"], nodeEnv: "production" });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/health`, {
      headers: { Origin: "https://app.example.com" }
    });

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "https://app.example.com"
    );
    assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  });
});

test("unknown origin is denied in production", async () => {
  const app = createApp({ corsOrigins: ["https://app.example.com"], nodeEnv: "production" });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/health`, {
      headers: { Origin: "https://evil.example.com" }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});

test("empty allowlist in production still denies unknown origins", async () => {
  const app = createApp({ corsOrigins: [], nodeEnv: "production" });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/health`, {
      headers: { Origin: "https://random.example.com" }
    });

    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});

test("preflight from an unknown origin is not approved", async () => {
  const app = createApp({ corsOrigins: ["https://app.example.com"], nodeEnv: "production" });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/reviews`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://evil.example.com",
        "Access-Control-Request-Method": "POST"
      }
    });

    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});

test("preflight from an allowlisted origin is approved", async () => {
  const app = createApp({ corsOrigins: ["https://app.example.com"], nodeEnv: "production" });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/reviews`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://app.example.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type"
      }
    });

    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "https://app.example.com"
    );
  });
});

test("requests without an Origin header still work", async () => {
  const app = createApp({ corsOrigins: [], nodeEnv: "production" });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/health`);

    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
  });
});

test("development without a configured allowlist stays permissive", async () => {
  const app = createApp({ corsOrigins: [], nodeEnv: "development" });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/health`, {
      headers: { Origin: "http://localhost:3000" }
    });

    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:3000"
    );
  });
});

test("allowlist matching tolerates a trailing slash", () => {
  const options = buildCorsOptions(["https://app.example.com/"], "production");
  let allowed = null;
  options.origin("https://app.example.com", (_error, result) => {
    allowed = result;
  });

  assert.equal(allowed, true);
});
