import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateSearchQuery } from "./search.js";

describe("Search Query Validation (#743)", () => {
  it("rejects missing, empty, or 1-char query", () => {
    const res1 = validateSearchQuery({});
    assert.equal(res1.ok, false);
    assert.equal(res1.error, "Search query 'q' must be at least 2 characters");

    const res2 = validateSearchQuery({ q: " " });
    assert.equal(res2.ok, false);
    assert.equal(res2.error, "Search query 'q' must be at least 2 characters");

    const res3 = validateSearchQuery({ q: "a" });
    assert.equal(res3.ok, false);
    assert.equal(res3.error, "Search query 'q' must be at least 2 characters");
  });

  it("rejects oversized search queries (> 100 chars)", () => {
    const longQuery = "a".repeat(101);
    const res = validateSearchQuery({ q: longQuery });
    assert.equal(res.ok, false);
    assert.equal(res.error, "Search query 'q' cannot exceed 100 characters");
  });

  it("accepts valid search query and trims whitespace", () => {
    const res = validateSearchQuery({ q: "  developer  " });
    assert.equal(res.ok, true);
    assert.equal(res.data.q, "developer");
  });
});
