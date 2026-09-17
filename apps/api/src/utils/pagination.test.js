import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parsePagination } from "./pagination.js";

describe("Pagination Utility (#743)", () => {
  it("defaults to take: 20 and skip: 0 when no query is given", () => {
    const { take, skip } = parsePagination({});
    assert.equal(take, 20);
    assert.equal(skip, 0);
  });

  it("clamps take to maxTake (default 50)", () => {
    const { take } = parsePagination({ take: "500" });
    assert.equal(take, 50);
  });

  it("supports limit and offset alias parameters", () => {
    const { take, skip } = parsePagination({ limit: "15", offset: "30" });
    assert.equal(take, 15);
    assert.equal(skip, 30);
  });
});
