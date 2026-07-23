import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /health returns ok payload", async () => {
  const app = createApp();
  const layer = app._router.stack.find(
    (entry) => entry.route?.path === "/health" && entry.route.methods.get,
  );

  assert.ok(layer, "expected /health GET route to be registered");

  const headers = new Map();
  const res = {
    statusCode: 0,
    body: undefined,
    set(name, value) {
      headers.set(name.toLowerCase(), value);
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  await layer.route.stack[0].handle({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(headers.get("cache-control"), "no-store");
  assert.deepEqual(res.body, { ok: true, service: "api" });
});
