import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";

test("#2845 registerUser: token sub matches returned id", async () => {
  const result = await registerUser({
    email: "test@example.com",
    password: "secret1234",
    role: "freelancer"
  });

  assert.ok(result.id.startsWith("usr_"), "id should start with usr_");

  // Decode the JWT token to verify subject
  const [, payloadB64] = result.token.split(".");
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

  assert.equal(payload.sub, result.id, "token sub must match returned id");
  assert.equal(payload.role, "freelancer", "token role must match provided role");
});

test("#2845 registerUser: two calls produce different ids", async () => {
  const r1 = await registerUser({ email: "a@b.com", password: "12345678", role: "client" });
  const r2 = await registerUser({ email: "b@c.com", password: "12345678", role: "client" });
  assert.notEqual(r1.id, r2.id, "each registration must produce a unique id");
  assert.notEqual(r1.token, r2.token, "each registration must produce a unique token");
});
