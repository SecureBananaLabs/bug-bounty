import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { request } from "./helpers/request.js";

test("Zod request validation failures return 400 with field details", async () => {
  const app = createApp();
  const response = await request(app, {
    body: {},
    method: "POST",
    path: "/api/jobs"
  });
  const payload = response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Validation failed");
  assert.ok(payload.issues.some((issue) => issue.path === "title"));
  assert.ok(payload.issues.some((issue) => issue.path === "budgetMin"));
});
