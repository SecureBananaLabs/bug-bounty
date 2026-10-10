import test from "node:test";
import assert from "node:assert/strict";
import { register } from "../controllers/authController.js";
import { registerSchema } from "../validators/auth.js";
import { verifyAccessToken } from "../utils/jwt.js";

const credentials = { email: "signup@example.test", password: "test-password-123" };

function responseRecorder() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test("public registration schema rejects administrator roles", () => {
  assert.equal(registerSchema.safeParse({ ...credentials, role: "admin" }).success, false);
});

test("registration returns 400 without issuing a token for an administrator role", async () => {
  const res = responseRecorder();
  await register({ body: { ...credentials, role: "admin" } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.data, undefined);
  assert.equal(res.body.token, undefined);
});

for (const role of ["client", "freelancer", undefined]) {
  test(`registration preserves the permitted role ${role ?? "default client"}`, async () => {
    const res = responseRecorder();
    const body = { ...credentials };
    if (role !== undefined) body.role = role;
    await register({ body }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.role, role ?? "client");
    assert.equal(verifyAccessToken(res.body.data.token).role, role ?? "client");
  });
}

test("invalid signup input returns 400 without rejecting the async controller", async () => {
  for (const body of [undefined, {}, { ...credentials, role: "owner" }, { ...credentials, email: "invalid" }]) {
    const res = responseRecorder();
    await register({ body }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.data, undefined);
  }
});
