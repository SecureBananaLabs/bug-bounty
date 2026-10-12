import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

test("POST /api/uploads returns 400 when file is missing", async () => {
  await withServer(async (baseUrl) => {
    // 1. Request with empty FormData
    const formData = new FormData();
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.deepEqual(body, {
      success: false,
      message: "File is required"
    });

    // 2. Request without any body
    const emptyResponse = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST"
    });
    assert.equal(emptyResponse.status, 400);
    const emptyBody = await emptyResponse.json();
    assert.deepEqual(emptyBody, {
      success: false,
      message: "File is required"
    });
  });
});

test("POST /api/uploads returns 201 and uploaded status when file is provided", async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    const fileContent = new Blob(["sample deliverable content"], { type: "text/plain" });
    formData.append("file", fileContent, "deliverable.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.deepEqual(body.data, {
      filename: "deliverable.txt",
      status: "uploaded"
    });
  });
});
