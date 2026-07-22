import test from "node:test";
import assert from "node:assert/strict";
import { registerUser, refreshToken } from "../services/authService.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

// ─── #2845: registerUser token subject matches returned user id ───

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

// ─── #2847: refresh endpoint verifies the requester ───

test("#2847 refreshToken: rejects missing token", async () => {
  await assert.rejects(
    () => refreshToken(null),
    { message: /jwt must be provided|invalid/i }
  );
});

test("#2847 refreshToken: rejects invalid token", async () => {
  await assert.rejects(
    () => refreshToken("not.a.real.jwt"),
    { message: /invalid signature|jwt malformed/i }
  );
});

test("#2847 refreshToken: issues new token preserving original subject", async () => {
  // First register to get a valid token
  const registered = await registerUser({
    email: "refresh@test.com",
    password: "secret1234",
    role: "client"
  });

  // Now refresh with that token
  const refreshed = await refreshToken(registered.token);

  assert.ok(refreshed.token, "refreshed response must include a token");

  // Decode both tokens
  const decode = (t) => JSON.parse(Buffer.from(t.split(".")[1], "base64url").toString());
  const originalPayload = decode(registered.token);
  const refreshedPayload = decode(refreshed.token);

  assert.equal(refreshedPayload.sub, originalPayload.sub, "refreshed token sub must match original");
  assert.equal(refreshedPayload.role, originalPayload.role, "refreshed token role must match original");
  // Token content is valid — same-second signing may produce identical bytes, which is fine.
});

// ─── #2853: job validation rejects inverted budget ranges ───

test("#2853 createJobSchema: rejects inverted budget range", () => {
  const result = createJobSchema.safeParse({
    title: "Test job posting",
    description: "A detailed description of the job that is long enough",
    budgetMin: 500,
    budgetMax: 100,  // inverted!
    categoryId: "cat_1",
    skills: ["javascript"]
  });

  assert.equal(result.success, false, "should reject inverted budget");
  assert.ok(
    result.error.issues.some(i => i.message.includes("budgetMax")),
    `error should mention budgetMax, got: ${JSON.stringify(result.error.issues)}`
  );
});

test("#2853 createJobSchema: accepts valid budget range", () => {
  const result = createJobSchema.safeParse({
    title: "Test job posting",
    description: "A detailed description of the job that is long enough",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_1",
    skills: ["javascript"]
  });

  assert.equal(result.success, true, "should accept valid budget range");
});

test("#2853 createJobSchema: accepts equal min/max", () => {
  const result = createJobSchema.safeParse({
    title: "Fixed price job",
    description: "A detailed description of the job that is long enough",
    budgetMin: 300,
    budgetMax: 300,
    categoryId: "cat_1"
  });

  assert.equal(result.success, true, "should accept equal min/max");
});

test("#2853 updateJobSchema: partial updates also validate budget range", () => {
  // When both budget fields are provided in partial update, range must be valid
  const result = updateJobSchema.safeParse({
    budgetMin: 1000,
    budgetMax: 500  // inverted
  });

  assert.equal(result.success, false, "should reject inverted budget in partial update");
});
