import test from "node:test";
import assert from "node:assert/strict";
import { refresh } from "../controllers/authController.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

function createResponse() {
  return {
    statusCode: undefined,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

test("POST /api/auth/refresh rejects missing token", async () => {
  const res = createResponse();

  await refresh({ body: {} }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.payload, { success: false, message: "Validation failed" });
});

test("POST /api/auth/refresh rejects invalid token", async () => {
  const res = createResponse();

  await refresh({ body: { token: "not-a-jwt" } }, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.payload, { success: false, message: "Invalid token" });
});

test("POST /api/auth/refresh signs a new token from the verified token subject and role", async () => {
  const res = createResponse();
  const token = signAccessToken({ sub: "usr_refreshable", role: "freelancer" });

  await refresh({ body: { token } }, res);
  const verified = verifyAccessToken(res.payload.data.token);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(verified.sub, "usr_refreshable");
  assert.equal(verified.role, "freelancer");
});
