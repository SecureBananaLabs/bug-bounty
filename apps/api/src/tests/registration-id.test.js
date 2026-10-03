import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registration returns matching user id and JWT subject", async () => {
  const result = await registerUser({
    email: "test@example.com",
    role: "client"
  });

  // The returned id must be a string starting with usr_
  assert.ok(result.id.startsWith("usr_"), "user id should start with usr_");

  // The JWT sub claim must match the returned user id exactly
  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, result.id, "JWT sub must match returned user id");
});

test("registration id is stable across property access", async () => {
  const result = await registerUser({
    email: "stable@example.com",
    role: "freelancer"
  });

  const firstAccess = result.id;
  const secondAccess = result.id;
  assert.equal(firstAccess, secondAccess, "id should not change between accesses");
});
