import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await fn(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("CORS echoes the configured frontend origin", async () => {
  const previous = process.env.FRONTEND_URL;
  process.env.FRONTEND_URL = "https://frontend.example.com";

  try {
    await withServer(async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}/health`, {
        headers: { Origin: "https://frontend.example.com" },
      });

      assert.equal(
        response.headers.get("access-control-allow-origin"),
        "https://frontend.example.com",
      );
    });
  } finally {
    if (previous === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = previous;
  }
});

test("CORS does not allow an unlisted origin", async () => {
  const previous = process.env.FRONTEND_URL;
  process.env.FRONTEND_URL = "https://frontend.example.com";

  try {
    await withServer(async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}/health`, {
        headers: { Origin: "https://evil.example.com" },
      });

      assert.equal(response.headers.get("access-control-allow-origin"), null);
    });
  } finally {
    if (previous === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = previous;
  }
});
