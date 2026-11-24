import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { registerUser } from "../services/authService.js";

test("registerUser returns an id matching the JWT sub claim", async () => {
  const result = await registerUser({ email: "new@example.com", role: "client" });

  const decoded = jwt.decode(result.token);

  assert.equal(decoded.sub, result.id);
});
