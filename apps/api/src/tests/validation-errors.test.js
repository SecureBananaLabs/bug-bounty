import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../middleware/errorHandler.js";
import { createJobSchema } from "../validators/job.js";

test("Zod validation failures return HTTP 400", () => {
  let statusCode;
  let payload;
  const req = {};
  const res = {
    headersSent: false,
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    }
  };
  const next = () => assert.fail("next should not be called for validation errors");

  const result = createJobSchema.safeParse({
    title: "Bad",
    description: "too short",
    budgetMin: -1,
    budgetMax: 100,
    categoryId: ""
  });
  assert.equal(result.success, false);

  errorHandler(result.error, req, res, next);

  assert.equal(statusCode, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Validation failed");
  assert.ok(payload.issues.some((issue) => issue.path === "budgetMin"));
});
