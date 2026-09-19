import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const validJob = {
  title: "Build dashboard",
  description: "Build a metrics dashboard",
  budgetMin: 100,
  budgetMax: 200,
  categoryId: "cat_web",
  skills: ["react"],
};

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/jobs returns 400 for invalid job payloads", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_test", role: "client" });
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ ...validJob, title: "No" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid job payload" });
  });
});

test("POST /api/jobs still accepts valid job payloads", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_test", role: "client" });
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(validJob),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, "Build dashboard");
  });
});
