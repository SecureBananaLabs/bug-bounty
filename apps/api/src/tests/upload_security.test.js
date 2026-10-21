import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Upload Security & Validation Gate", async (t) => {
  let server;
  let baseUrl;

  t.beforeEach(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((res) => server.once("listening", res));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  t.afterEach(async () => {
    if (server) {
      await new Promise((res) => server.close(res));
    }
  });

  await t.test("POST /api/uploads returns 401 when Authorization header is missing", async () => {
    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST"
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  });

  await t.test("POST /api/uploads returns 400 when authenticated but no file is attached", async () => {
    const token = signAccessToken({ sub: "usr_uploader", role: "freelancer" });
    const formData = new FormData();

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "No file uploaded");
  });

  await t.test("POST /api/uploads returns 201 when authenticated and file is provided", async () => {
    const token = signAccessToken({ sub: "usr_uploader", role: "freelancer" });
    const formData = new FormData();
    const fileBlob = new Blob(["Audit security findings and code scan results."], { type: "text/plain" });
    formData.append("file", fileBlob, "security_audit.txt");

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.filename, "security_audit.txt");
    assert.equal(body.data.status, "uploaded");
    assert.equal(body.data.mimetype, "text/plain");
    assert.ok(body.data.size > 0);
  });
});
