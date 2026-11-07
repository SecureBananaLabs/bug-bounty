import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

test("POST /api/uploads without token is rejected (401)", async () => {
  const server = await startServer();
  try {
    const form = new FormData();
    form.append("file", new Blob(["x"]), "x.txt");
    const response = await fetch(`${server.baseUrl}/api/uploads`, {
      method: "POST",
      body: form,
    });
    assert.equal(response.status, 401);
  } finally {
    await server.close();
  }
});

test("POST /api/uploads with token and file succeeds (201)", async () => {
  const server = await startServer();
  try {
    const token = signAccessToken({ id: "user-1" });
    const form = new FormData();
    form.append("file", new Blob(["hello"]), "hello.txt");
    const response = await fetch(`${server.baseUrl}/api/uploads`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: form,
    });
    assert.equal(response.status, 201);
  } finally {
    await server.close();
  }
});
