import test from "node:test";
import assert from "assert/strict";

// Inline validation logic (mirrors notificationController)
const notificationSchema = {
  userId: (v) => typeof v === "string" && v.length > 0,
  title: (v) => typeof v === "string" && v.length > 0 && v.length <= 200,
  body: (v) => typeof v === "string" && v.length > 0 && v.length <= 5000,
  type: (v) => ["info", "warning", "success", "error"].includes(v),
};

function validateNotification(payload) {
  if (!payload || typeof payload !== "object") return { valid: false, errors: ["Request body must be a non-null object"] };
  const errors = [];
  for (const [field, checker] of Object.entries(notificationSchema)) {
    if (!(field in payload)) { errors.push(`Missing required field: ${field}`); continue; }
    if (!checker(payload[field])) { errors.push(`Invalid value for field: ${field}`); }
  }
  const allowed = new Set(Object.keys(notificationSchema));
  const unknown = Object.keys(payload).filter(k => !allowed.has(k));
  if (unknown.length > 0) errors.push(`Unknown fields not allowed: ${unknown.join(", ")}`);
  return { valid: errors.length === 0, errors };
}

test("valid notification passes validation", () => {
  const result = validateNotification({
    userId: "user_1",
    title: "Welcome!",
    body: "Your account has been created.",
    type: "info",
  });
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("empty object fails with missing fields", () => {
  const result = validateNotification({});
  assert.equal(result.valid, false);
  // Should have at least 4 missing field errors
  assert.ok(result.errors.length >= 4);
});

test("null/undefined body is rejected", () => {
  const r1 = validateNotification(null);
  assert.equal(r1.valid, false);
  const r2 = validateNotification(undefined);
  assert.equal(r2.valid, false);
});

test("missing single field (userId) is caught", () => {
  const result = validateNotification({
    title: "Test",
    body: "Body text",
    type: "info",
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("userId")));
});

test("unknown fields are rejected (mass-assignment protection)", () => {
  const result = validateNotification({
    userId: "u1",
    title: "T",
    body: "B",
    type: "info",
    adminApproved: true,
    internalNotes: "hack",
    id: "spoofed_id",
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("Unknown fields")));
  assert.ok(result.errors.some(e => e.includes("adminApproved")));
});

test("title too long (>200 chars) is rejected", () => {
  const result = validateNotification({
    userId: "u1",
    title: "A".repeat(201),
    body: "Valid body",
    type: "info",
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("title")));
});

test("body too long (>5000 chars) is rejected", () => {
  const result = validateNotification({
    userId: "u1",
    title: "Valid title",
    body: "B".repeat(5001),
    type: "info",
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("body")));
});

test("invalid type value is rejected", () => {
  const result = validateNotification({
    userId: "u1",
    title: "T",
    body: "B",
    type: "hacked_type",
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("type")));
});

test("all valid types are accepted", () => {
  for (const t of ["info", "warning", "success", "error"]) {
    const result = validateNotification({
      userId: "u1",
      title: "T",
      body: "B",
      type: t,
    });
    assert.equal(result.valid, true, `type "${t}" should be valid`);
  }
});

test("empty string values are rejected", () => {
  const result = validateNotification({
    userId: "",
    title: "",
    body: "",
    type: "info",
  });
  assert.equal(result.valid, false);
  // All three empty-string fields should fail
  assert.ok(result.errors.filter(e => e.includes("Invalid")).length >= 3);
});
