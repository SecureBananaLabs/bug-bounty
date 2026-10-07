import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { registerUser } from "../services/authService.js";

test("registerUser uses the same generated id for response id and token subject", async () => {
  const user = await registerUser({
    email: "client@example.com",
    role: "client"
  });

  const decoded = jwt.decode(user.token);

  assert.match(user.id, /^usr_\d+$/);
  assert.equal(decoded.sub, user.id);
  assert.equal(decoded.role, "client");
});
