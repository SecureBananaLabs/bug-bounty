import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { request } from "./helpers/request.js";

test("GET /health returns ok payload", async () => {
  const app = createApp();
  const response = await request(app, { path: "/health" });
  const payload = response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api" });
});
