import { test, mock } from "node:test";
import assert from "node:assert";
import { registerSchema } from "../validators/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import { signAccessToken } from "../utils/jwt.js";

test("Role-Based Access Control and Privilege Escalation", async (t) => {
  await t.test("registerSchema should not allow 'admin' role", () => {
    assert.throws(() => {
      registerSchema.parse({
        email: "hacker@example.com",
        password: "password123",
        role: "admin"
      });
    }, /Invalid enum value/);
  });

  await t.test("adminMiddleware should reject non-admin users", () => {
    const req = { user: { role: "client" } };
    let failed = false;
    const res = {
      status: () => ({ json: () => { failed = true; } })
    };
    const next = () => {};

    adminMiddleware(req, res, next);
    assert.strictEqual(failed, true, "Should have failed the request");
  });

  await t.test("adminMiddleware should allow admin users", () => {
    const req = { user: { role: "admin" } };
    let passed = false;
    const res = {};
    const next = () => { passed = true; };

    adminMiddleware(req, res, next);
    assert.strictEqual(passed, true, "Should have called next()");
  });
});
