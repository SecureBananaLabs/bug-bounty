import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function buildForm(text) {
  const form = new FormData();
  const blob = new Blob([text], { type: "text/plain" });
  form.append("file", blob, "notes.txt");
  return form;
}

test("POST /api/uploads requires a bearer token", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: buildForm("hello")
  });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.success, false);

  await close(server);
});

test("POST /api/uploads stores a file for an authenticated caller", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const token = signAccessToken({ sub: "usr_1", role: "freelancer" });
  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: buildForm("hello")
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.filename, "notes.txt");
  assert.equal(payload.data.status, "uploaded");

  await close(server);
});
