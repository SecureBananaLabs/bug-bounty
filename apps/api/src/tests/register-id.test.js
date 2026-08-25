import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { registerUser } from "../services/authService.js";
import { env } from "../config/env.js";

test("registerUser token subject matches returned id even if time advances", async () => {
  const realNow = Date.now;
  let calls = 0;
  Date.now = () => {
    calls += 1;
    return 1_700_000_000_000 + calls * 25;
  };
  try {
    const result = await registerUser({ email: "a@example.com", role: "client" });
    const decoded = jwt.verify(result.token, env.jwtSecret);
    assert.equal(result.id, decoded.sub);
    assert.equal(result.id, "usr_1700000000025");
  } finally {
    Date.now = realNow;
  }
});
