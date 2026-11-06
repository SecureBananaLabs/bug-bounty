import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { registerSchema } from "../validators/auth.js";
import { createJobSchema } from "../validators/job.js";

function createResponse() {
  return {
    statusCode: undefined,
    body: undefined,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.headersSent = true;
      return this;
    }
  };
}

async function runValidation(handler) {
  const res = createResponse();
  const wrapped = asyncHandler(handler);
  await wrapped({}, res, (error) => errorHandler(error, {}, res, assert.fail));
  return res;
}

test("validation errors return sanitized 400 responses", async () => {
  const response = await runValidation(async () => {
    registerSchema.parse({ email: "not-an-email", password: "short" });
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Validation error");
  assert.ok(response.body.errors.some((issue) => issue.path.includes("email")));
  assert.ok(response.body.errors.some((issue) => issue.path.includes("password")));
  assert.deepEqual(Object.keys(response.body.errors[0]).sort(), ["code", "message", "path"]);
});

test("job validation errors keep field paths in 400 responses", async () => {
  const response = await runValidation(async () => {
    createJobSchema.parse({
      title: "Bug",
      description: "too short",
      budgetMin: -1,
      budgetMax: 100,
      categoryId: "",
      skills: [""]
    });
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Validation error");
  assert.ok(response.body.errors.some((issue) => issue.path.includes("title")));
  assert.ok(response.body.errors.some((issue) => issue.path.includes("budgetMin")));
  assert.ok(response.body.errors.some((issue) => issue.path.includes("categoryId")));
});
