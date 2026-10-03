import test from "node:test";
import assert from "node:assert/strict";
import { refreshToken } from "../services/authService.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";
import { refreshSchema } from "../validators/auth.js";

// --- refreshSchema validation tests ---

test("refreshSchema: missing token field throws ZodError", () => {
  assert.throws(
    () => refreshSchema.parse({}),
    (err) => {
      assert.equal(err.constructor.name, "ZodError");
      return true;
    }
  );
});

test("refreshSchema: non-string token throws ZodError", () => {
  assert.throws(
    () => refreshSchema.parse({ token: 123 }),
    (err) => {
      assert.equal(err.constructor.name, "ZodError");
      return true;
    }
  );
});

test("refreshSchema: valid token string passes", () => {
  const result = refreshSchema.parse({ token: "some.token.value" });
  assert.equal(result.token, "some.token.value");
});

// --- refreshToken service tests ---

test("refreshToken: missing/undefined token throws", async () => {
  await assert.rejects(
    async () => refreshToken(undefined),
    (err) => {
      // jsonwebtoken throws JsonWebTokenError or similar
      assert.ok(err instanceof Error);
      return true;
    }
  );
});

test("refreshToken: invalid token string throws", async () => {
  await assert.rejects(
    async () => refreshToken("this.is.not.valid"),
    (err) => {
      assert.ok(err instanceof Error);
      return true;
    }
  );
});

test("refreshToken: valid token returns new token with matching sub and role", async () => {
  const originalToken = signAccessToken({ sub: "usr_abc123", role: "freelancer" });
  const result = await refreshToken(originalToken);

  assert.ok(result.token, "result should have a token property");
  assert.equal(typeof result.token, "string", "token should be a string");

  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, "usr_abc123");
  assert.equal(decoded.role, "freelancer");
});

test("refreshToken: preserves role=admin from original token", async () => {
  const originalToken = signAccessToken({ sub: "usr_admin1", role: "admin" });
  const result = await refreshToken(originalToken);

  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, "usr_admin1");
  assert.equal(decoded.role, "admin");
});

test("refreshToken: preserves role=client from original token", async () => {
  const originalToken = signAccessToken({ sub: "usr_client99", role: "client" });
  const result = await refreshToken(originalToken);

  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, "usr_client99");
  assert.equal(decoded.role, "client");
});
