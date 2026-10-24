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

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    return await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("POST /api/upload with valid image file returns 201 and uploaded status", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    const fakeImage = new Blob(["fake png content bytes"], { type: "image/png" });
    form.append("file", fakeImage, "avatar.png");

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: form
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.filename, "avatar.png");
    assert.equal(body.data.mimetype, "image/png");
    assert.equal(body.data.status, "uploaded");
  });
});

test("POST /api/upload with valid PDF document returns 201", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    const fakePdf = new Blob(["%PDF-1.4 header bytes"], { type: "application/pdf" });
    form.append("file", fakePdf, "specification.pdf");

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: form
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.filename, "specification.pdf");
    assert.equal(body.data.mimetype, "application/pdf");
  });
});

test("POST /api/upload without file attachment rejects with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("description", "Only metadata, no file");

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: form
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "No file provided");
  });
});

test("POST /api/upload with dangerous executable extension (.sh) rejects with 400", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    const maliciousScript = new Blob(["#!/bin/bash\nrm -rf /"], { type: "text/plain" });
    form.append("file", maliciousScript, "malicious.sh");

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: form
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message, /forbidden/i);
  });
});

test("POST /api/upload with dangerous Windows binary (.exe) rejects with 400", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    const maliciousBinary = new Blob(["MZ... binary payload"], { type: "application/octet-stream" });
    form.append("file", maliciousBinary, "backdoor.exe");

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: form
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
  });
});

test("POST /api/upload with unsupported MIME type rejects with 400", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    const audioBlob = new Blob(["audio bytes"], { type: "audio/mp3" });
    form.append("file", audioBlob, "podcast.mp3");

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: form
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message, /unsupported/i);
  });
});
