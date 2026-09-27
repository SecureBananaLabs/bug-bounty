import test from "node:test";
import assert from "node:assert/strict";
import { loginUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("loginUser signs tokens with the login payload role", async () => {
  for (const role of ["client", "freelancer", "admin"]) {
    const result = await loginUser({
      email: `${role}@example.com`,
      password: "password123",
      role
    });
    const decoded = verifyAccessToken(result.token);

    assert.equal(decoded.sub, "usr_existing");
    assert.equal(decoded.role, role);
  }
});

test("loginUser defaults to client role when no role is available", async () => {
  const result = await loginUser({
    email: "client-default@example.com",
    password: "password123"
  });
  const decoded = verifyAccessToken(result.token);

  assert.equal(decoded.role, "client");
});
