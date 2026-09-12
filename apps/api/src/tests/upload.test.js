import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function makeApp() {
  const app = createApp();
  const server = app.listen(0);
  const ready = new Promise((r, e) => { server.once("listening", r); server.once("error", e); });
  return { server, ready };
}

function close(server) {
  return new Promise((r, e) => { server.close(err => err ? e(err) : r()); });
}

test("POST /api/uploads without file returns 400", async () => {
  const { server, ready } = makeApp();
  await ready;
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, { method: "POST" });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.ok(body.message.toLowerCase().includes("no file"));

  await close(server);
});

test("POST /api/uploads with file returns 201", async () => {
  const { server, ready } = makeApp();
  await ready;
  const { port } = server.address();

  const form = new FormData();
  form.append("file", new Blob(["hello"]), "test.txt");

  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, { method: "POST", body: form });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.status, "uploaded");
  assert.equal(body.data.filename, "test.txt");

  await close(server);
});
