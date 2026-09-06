import test from "node:test";
import assert from "node:assert/strict";
import { findFreelancerByUsername } from "./lookup.js";

/**
 * Tests for the freelancer profile lookup logic.
 * Verifies that mock freelancers can be found by username
 * and that unknown usernames return null.
 */

const freelancers = [
  { username: "maya-dev", skills: ["Next.js", "TypeScript"], rate: "$65/hr" },
  { username: "jordan-ux", skills: ["Figma", "UX Research"], rate: "$52/hr" },
];

test("finds freelancer by exact username", () => {
  const result = findFreelancerByUsername(freelancers, "maya-dev");
  assert.ok(result);
  assert.equal(result.username, "maya-dev");
  assert.equal(result.rate, "$65/hr");
  assert.deepEqual(result.skills, ["Next.js", "TypeScript"]);
});

test("finds second freelancer by username", () => {
  const result = findFreelancerByUsername(freelancers, "jordan-ux");
  assert.ok(result);
  assert.equal(result.username, "jordan-ux");
  assert.equal(result.rate, "$52/hr");
  assert.deepEqual(result.skills, ["Figma", "UX Research"]);
});

test("returns null for unknown username", () => {
  const result = findFreelancerByUsername(freelancers, "unknown-user");
  assert.equal(result, null);
});

test("returns null for empty username", () => {
  const result = findFreelancerByUsername(freelancers, "");
  assert.equal(result, null);
});

test("is case-sensitive", () => {
  const result = findFreelancerByUsername(freelancers, "MAYA-DEV");
  assert.equal(result, null);
});

test("returns null when the source list is invalid", () => {
  const result = findFreelancerByUsername(null, "maya-dev");
  assert.equal(result, null);
});
