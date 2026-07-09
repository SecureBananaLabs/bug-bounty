import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Upload Authentication", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_uploader", role: "client" });

  t.after(() => {
    server.close();
  });

  await t.test("POST /api/uploads blocks unauthenticated request", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST"
    });
    assert.equal(response.status, 401);
  });

  await t.test("POST /api/uploads permits authenticated request", async () => {
    const form = new FormData();
    const blob = new Blob(["hello world"], { type: "text/plain" });
    form.append("file", blob, "hello.txt");

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: form
    });
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.equal(data.data.filename, "hello.txt");
  });
});
