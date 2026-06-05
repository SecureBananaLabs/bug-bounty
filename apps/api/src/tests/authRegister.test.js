import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { registerUser } from "../services/authService.js";

// Decode JWT without verifying signature (we only need the payload)
function decodeToken(token) {
  const [, payloadB64] = token.split(".");
  return JSON.parse(Buffer.from(payloadB64, "base64url").toString());
}

// ─── registerUser returns consistent id and token sub ────────

test("registerUser: token sub matches returned id", async () => {
  const result = await registerUser({ email: "test@example.com", role: "client" });

  assert.ok(result.id, "result should have an id");
  assert.ok(result.token, "result should have a token");

  const decoded = decodeToken(result.token);
  assert.equal(decoded.sub, result.id, "JWT sub must equal the returned user id");
});

test("registerUser: id and token sub use the same generated value", async () => {
  const result = await registerUser({ email: "a@b.com", role: "freelancer" });
  const decoded = decodeToken(result.token);

  // Both should reference the same usr_<timestamp> id
  assert.ok(result.id.startsWith("usr_"), "id should start with usr_");
  assert.equal(decoded.sub, result.id);
  assert.equal(decoded.role, "freelancer");
});

test("registerUser: each call generates a consistent id (sub always matches)", async () => {
  const r1 = await registerUser({ email: "a@b.com", role: "client" });
  const r2 = await registerUser({ email: "c@d.com", role: "client" });

  // Both calls independently produce valid, self-consistent results
  const d1 = decodeToken(r1.token);
  const d2 = decodeToken(r2.token);
  assert.equal(d1.sub, r1.id, "first call: sub matches id");
  assert.equal(d2.sub, r2.id, "second call: sub matches id");
  assert.ok(r1.id.startsWith("usr_"), "id format");
});

test("registerUser: response shape is unchanged", async () => {
  const result = await registerUser({ email: "x@y.com", role: "client" });

  assert.deepEqual(Object.keys(result).sort(), ["email", "id", "role", "token"]);
  assert.equal(result.email, "x@y.com");
  assert.equal(result.role, "client");
});
