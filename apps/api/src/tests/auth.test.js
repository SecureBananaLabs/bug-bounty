import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { refreshSchema } from "../validators/auth.js";

describe("refreshSchema", () => {
  it("accepts valid token", () => {
    const result = refreshSchema.safeParse({ token: "valid.jwt.token" });
    assert.equal(result.success, true);
  });

  it("rejects empty body", () => {
    const result = refreshSchema.safeParse({});
    assert.equal(result.success, false);
  });

  it("rejects empty token string", () => {
    const result = refreshSchema.safeParse({ token: "" });
    assert.equal(result.success, false);
  });
});