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

test("upload route rejects an anonymous caller", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const form = new FormData();
    form.append("file", new Blob(["hello"]), "hello.txt");

    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/uploads`, {
      method: "POST",
      body: form
    });

    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { success: false, message: "Unauthorized" });
  } finally {
    await close(server);
  }
});

test("upload route rejects a token that cannot be verified", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const form = new FormData();
    form.append("file", new Blob(["hello"]), "hello.txt");

    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/uploads`, {
      method: "POST",
      headers: { authorization: "Bearer not-a-jwt" },
      body: form
    });

    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { success: false, message: "Invalid token" });
  } finally {
    await close(server);
  }
});

test("upload route stores a file for an authenticated caller", async () => {
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
  } finally {
    await close(server);
  }
});
