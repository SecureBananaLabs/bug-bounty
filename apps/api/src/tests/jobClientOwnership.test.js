import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const validJob = {
  title: "Build onboarding flow",
  description: "Create a reliable onboarding flow for new clients.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["react"]
};

async function withServer(handler) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await handler(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function authHeader(userId = "usr_client") {
  return `Bearer ${signAccessToken({ sub: userId, role: "client" })}`;
}

test("POST /api/jobs rejects unauthenticated creation", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validJob)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/jobs rejects spoofed client ids", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        authorization: authHeader("usr_real_client"),
        "content-type": "application/json"
      },
      body: JSON.stringify({ ...validJob, clientId: "usr_other_client" })
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(payload, {
      success: false,
      message: "Client id does not match authenticated user"
    });
  });
});

test("POST /api/jobs stores client id from authenticated user", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        authorization: authHeader("usr_real_client"),
        "content-type": "application/json"
      },
      body: JSON.stringify(validJob)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^job_/);
    assert.equal(payload.data.clientId, "usr_real_client");
    assert.equal(payload.data.status, "open");
    assert.equal(payload.data.title, validJob.title);
  });
});

test("GET /api/jobs remains public", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`);

    assert.equal(response.status, 200);
  });
});
