import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validJobPayload = {
  clientId: "client_123",
  title: "Build landing page",
  description: "Create a polished landing page for a marketplace launch.",
  budgetMin: 500,
  budgetMax: 1200,
  categoryId: "category_web",
  skills: ["react", "design"]
};

test("createJobSchema preserves required client owner id", () => {
  const payload = createJobSchema.parse(validJobPayload);

  assert.equal(payload.clientId, "client_123");
  assert.deepEqual(payload.skills, ["react", "design"]);
});

test("createJobSchema rejects jobs without a client owner id", () => {
  const { clientId, ...payloadWithoutClientId } = validJobPayload;
  const result = createJobSchema.safeParse(payloadWithoutClientId);

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["clientId"]);
});
