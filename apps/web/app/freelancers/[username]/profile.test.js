import test from "node:test";
import assert from "node:assert/strict";

/**
 * Tests for the freelancer profile lookup logic.
 * Verifies that mock freelancers can be found by username
 * and that unknown usernames return null.
 */

const freelancers = [
  { username: "maya-dev", skills: ["Next.js", "TypeScript"], rate: "$65/hr" },
  { username: "jordan-ux", skills: ["Figma", "UX Research"], rate: "$52/hr" },
];

function findFreelancer(username) {
  return freelancers.find((f) => f.username === username) || null;
}

test("finds freelancer by exact username", () => {
  const result = findFreelancer("maya-dev");
  assert.ok(result);
  assert.equal(result.username, "maya-dev");
  assert.equal(result.rate, "$65/hr");
  assert.deepEqual(result.skills, ["Next.js", "TypeScript"]);
});

test("finds second freelancer by username", () => {
  const result = findFreelancer("jordan-ux");
  assert.ok(result);
  assert.equal(result.username, "jordan-ux");
  assert.equal(result.rate, "$52/hr");
  assert.deepEqual(result.skills, ["Figma", "UX Research"]);
});

test("returns null for unknown username", () => {
  const result = findFreelancer("unknown-user");
  assert.equal(result, null);
});

test("returns null for empty username", () => {
  const result = findFreelancer("");
  assert.equal(result, null);
});

test("is case-sensitive", () => {
  const result = findFreelancer("MAYA-DEV");
  assert.equal(result, null);
});
