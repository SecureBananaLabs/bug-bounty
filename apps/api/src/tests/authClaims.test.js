import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";

async function withServer(assertion) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertion(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function bearer(payload) {
  return `Bearer ${jwt.sign(payload, env.jwtSecret)}`;
}

test("protected routes accept valid access-token identity claims", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        authorization: bearer({ sub: "usr_123", role: "client" })
      }
    });

    assert.equal(response.status, 200);
  });
});

test("protected routes reject signed string JWT payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        authorization: bearer("usr_123")
      }
    });

    assert.equal(response.status, 401);
  });
});

test("protected routes reject tokens missing subject claims", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        authorization: bearer({ role: "client" })
      }
    });

    assert.equal(response.status, 401);
  });
});

test("protected routes reject tokens with unsupported roles", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        authorization: bearer({ sub: "usr_123", role: "owner" })
      }
    });

    assert.equal(response.status, 401);
  });
});

