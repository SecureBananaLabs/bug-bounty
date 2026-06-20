import test from "node:test";
import assert from "node:assert/strict";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";

function createMockResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

async function requestAdminMetrics(role) {
  const token = role ? signAccessToken({ sub: `usr_${role}`, role }) : null;
  const req = {
    headers: token ? { authorization: `Bearer ${token}` } : {}
  };
  const res = createMockResponse();

  let authenticated = false;
  authMiddleware(req, res, () => {
    authenticated = true;
  });

  if (!authenticated) {
    return res;
  }

  let authorized = false;
  requireRole("admin")(req, res, () => {
    authorized = true;
  });

  if (!authorized) {
    return res;
  }

  await metrics(req, res);
  return res;
}

test("admin metrics rejects requests without a token", async () => {
  const res = await requestAdminMetrics();

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { success: false, message: "Unauthorized" });
});

test("admin metrics rejects authenticated non-admin users", async () => {
  const res = await requestAdminMetrics("client");

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { success: false, message: "Forbidden" });
});

test("admin metrics allows admin users", async () => {
  const res = await requestAdminMetrics("admin");

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.openJobs, 42);
});
