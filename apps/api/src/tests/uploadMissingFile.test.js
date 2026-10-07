import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("upload without a file is rejected instead of reported as created", async () => {
  const app = createApp();
  const server = await listen(app);
  const token = signAccessToken({ sub: "usr_7", role: "freelancer" });
  try {
    const form = new FormData();
    form.append("note", "no attachment here");

    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/uploads`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: form
    });

    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { success: false, message: "A file is required" });
  } finally {
    await close(server);
  }
});

test("upload with a file is reported as created", async () => {
  const app = createApp();
  const server = await listen(app);
  const token = signAccessToken({ sub: "usr_7", role: "freelancer" });
  try {
    const form = new FormData();
    form.append("file", new Blob(["hello"]), "hello.txt");

    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/uploads`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: form
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.filename, "hello.txt");
    assert.equal(body.data.status, "uploaded");
  } finally {
    await close(server);
  }
});
