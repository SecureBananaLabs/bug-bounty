import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const validJobPayload = {
  title: "Build a landing page",
  description: "Create a responsive landing page for a product launch.",
  budgetMin: 500,
  budgetMax: 1500,
  categoryId: "cat_web",
  skills: ["nextjs", "css"]
};

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/jobs rejects unauthenticated job creation", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validJobPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("POST /api/jobs allows authenticated job creation", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(validJobPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, validJobPayload.title);
    assert.equal(payload.data.status, "open");
    assert.match(payload.data.id, /^job_/);
  });
});
