import test from "node:test";
import assert from "node:assert/strict";
import { oauthProviderSchema } from "../validators/oauth.js";

test("oauthProviderSchema accepts valid providers", () => {
  const googleResult = oauthProviderSchema.safeParse("google");
  assert.equal(googleResult.success, true);

  const githubResult = oauthProviderSchema.safeParse("github");
  assert.equal(githubResult.success, true);
});

test("oauthProviderSchema rejects invalid providers", () => {
  const invalidResult = oauthProviderSchema.safeParse("facebook");
  assert.equal(invalidResult.success, false);
});

test("oauthProviderSchema rejects path traversal attempts", () => {
  const result = oauthProviderSchema.safeParse("../../admin");
  assert.equal(result.success, false);
});

test("oauthProviderSchema rejects null", () => {
  const result = oauthProviderSchema.safeParse(null);
  assert.equal(result.success, false);
});

test("oauthProviderSchema rejects empty string", () => {
  const result = oauthProviderSchema.safeParse("");
  assert.equal(result.success, false);
});

test("oauthProviderSchema rejects long garbage strings", () => {
  const garbage = "x".repeat(500);
  const result = oauthProviderSchema.safeParse(garbage);
  assert.equal(result.success, false);
});
