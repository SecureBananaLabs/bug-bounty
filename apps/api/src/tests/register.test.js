import test from "node:test";
import assert from "node:assert/strict";

test("registerSchema rejects missing fullName", async () => {
  const { registerSchema } = await import("../validators/auth.js");
  assert.throws(() => registerSchema.parse({ email: "a@b.com", password: "12345678" }));
});

test("registerSchema accepts valid fullName", async () => {
  const { registerSchema } = await import("../validators/auth.js");
  const result = registerSchema.parse({ email: "a@b.com", password: "12345678", fullName: "Alice" });
  assert.equal(result.fullName, "Alice");
});
