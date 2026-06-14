import { describe, it } from "node:test";
import assert from "node:assert";
import { freelancers } from "../lib/mock.ts";

describe("freelancer mock lookup", () => {
  it("resolves known freelancer by username", () => {
    const result = freelancers.find((f) => f.username === "maya-dev");
    assert.ok(result);
    assert.strictEqual(result.username, "maya-dev");
    assert.deepStrictEqual(result.skills, ["Next.js", "TypeScript"]);
    assert.strictEqual(result.rate, "$65/hr");
  });

  it("resolves second known freelancer", () => {
    const result = freelancers.find((f) => f.username === "jordan-ux");
    assert.ok(result);
    assert.strictEqual(result.username, "jordan-ux");
    assert.deepStrictEqual(result.skills, ["Figma", "UX Research"]);
    assert.strictEqual(result.rate, "$52/hr");
  });

  it("returns undefined for unknown username", () => {
    const result = freelancers.find((f) => f.username === "nonexistent");
    assert.strictEqual(result, undefined);
  });

  it("returns undefined for empty string username", () => {
    const result = freelancers.find((f) => f.username === "");
    assert.strictEqual(result, undefined);
  });
});
