import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { loginSchema, registerSchema } from "../validators/auth.js";

test("registerSchema rejects whitespace-only passwords", () => {
  assert.throws(
    () => registerSchema.parse({ email: "client@example.com", password: "        " }),
    (error) => {
      assert.ok(error instanceof ZodError);
      assert.equal(error.issues[0].path[0], "password");
      assert.equal(error.issues[0].code, "custom");
      return true;
    }
  );
});

test("loginSchema rejects passwords without enough non-whitespace characters", () => {
  assert.throws(
    () => loginSchema.parse({ email: "client@example.com", password: "abcd    " }),
    (error) => {
      assert.ok(error instanceof ZodError);
      assert.equal(error.issues[0].path[0], "password");
      assert.equal(error.issues[0].code, "custom");
      return true;
    }
  );
});

test("auth validators preserve valid passwords without trimming", () => {
  const password = "  abcdefgh  ";
  const registerPayload = registerSchema.parse({ email: "client@example.com", password });
  const loginPayload = loginSchema.parse({ email: "client@example.com", password });

  assert.equal(registerPayload.password, password);
  assert.equal(loginPayload.password, password);
});
