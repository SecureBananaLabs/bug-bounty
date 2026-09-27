import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { registerUser } from "../services/authService.js";
import { env } from "../config/env.js";

test("registerUser signs the access token for the same user id it returns", async () => {
  const originalDateNow = Date.now;
  let now = 1700000000000;
  Date.now = () => now++;

  try {
    const result = await registerUser({
      email: "evelyn@example.com",
      password: "supersecret",
      fullName: "Evelyn",
      role: "client"
    });

    const decoded = jwt.verify(result.token, env.jwtSecret);

    assert.equal(result.id, "usr_1700000000000");
    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, "client");
  } finally {
    Date.now = originalDateNow;
  }
});
