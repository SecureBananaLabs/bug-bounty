import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";
import { registerUser } from "../services/authService.js";

function decodeJwtPayload(token) {
  const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

test("auth validators reject blank passwords", () => {
  assert.throws(() => registerSchema.parse({ email: "jon@example.com", password: "        " }));
  assert.throws(() => loginSchema.parse({ email: "jon@example.com", password: "        " }));
});

test("registerUser signs the same id it returns", async () => {
  const originalDateNow = Date.now;
  let calls = 0;
  Date.now = () => {
    calls += 1;
    return calls === 1 ? 1111111111111 : 2222222222222;
  };

  try {
    const result = await registerUser({ email: "jon@example.com", password: "password123", role: "client" });
    const decoded = decodeJwtPayload(result.token);

    assert.equal(result.id, "usr_1111111111111");
    assert.equal(decoded.sub, result.id);
  } finally {
    Date.now = originalDateNow;
  }
});
