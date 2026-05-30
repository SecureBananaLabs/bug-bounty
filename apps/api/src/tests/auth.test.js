import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { requireRole } from "../middleware/auth.js";

test("registerSchema role validation", () => {
  // Valid roles
  assert.doesNotThrow(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123",
      role: "client"
    });
  });

  assert.doesNotThrow(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123",
      role: "freelancer"
    });
  });

  assert.doesNotThrow(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123"
    });
  });

  // Invalid role: admin should fail validation
  assert.throws(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123",
      role: "admin"
    });
  });
});

test("registerUser token sub matches returned user id", async () => {
  const payload = {
    email: "test@example.com",
    role: "client"
  };
  const result = await registerUser(payload);
  assert.ok(result.id);
  assert.ok(result.token);
  
  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, result.id, "JWT subject must match the returned user id exactly");
});

test("requireRole middleware allows correct role", () => {
  const middleware = requireRole("admin");
  const req = { user: { role: "admin" } };
  let calledNext = false;
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  const next = () => { calledNext = true; };

  middleware(req, res, next);
  assert.ok(calledNext);
});

test("requireRole middleware rejects incorrect role", () => {
  const middleware = requireRole("admin");
  const req = { user: { role: "client" } };
  let calledNext = false;
  let responseStatus = 0;
  let responseBody = null;
  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    }
  };
  const next = () => { calledNext = true; };

  middleware(req, res, next);
  assert.ok(!calledNext);
  assert.equal(responseStatus, 403);
  assert.equal(responseBody.success, false);
  assert.equal(responseBody.message, "Forbidden");
});
