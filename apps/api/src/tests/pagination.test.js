import test from "node:test";
import assert from "node:assert/strict";
import { parsePagination } from "../utils/pagination.js";

test("Bounded pagination helper suite", async (t) => {
  await t.test("Returns default pagination when query is empty or undefined", () => {
    const res1 = parsePagination();
    assert.equal(res1.take, 20);
    assert.equal(res1.skip, 0);
    assert.equal(res1.limit, 20);
    assert.equal(res1.offset, 0);

    const res2 = parsePagination({});
    assert.equal(res2.take, 20);
    assert.equal(res2.skip, 0);
  });

  await t.test("Parses string numbers from URL query parameters", () => {
    const res = parsePagination({ take: "15", skip: "40" });
    assert.equal(res.take, 15);
    assert.equal(res.skip, 40);
  });

  await t.test("Clamps take at maxTake limit (default 50)", () => {
    const res = parsePagination({ take: "250" });
    assert.equal(res.take, 50);

    const customRes = parsePagination({ take: "100" }, 10, 30);
    assert.equal(customRes.take, 30);
  });

  await t.test("Enforces minimum bounds on take (>= 1) and skip (>= 0)", () => {
    const res = parsePagination({ take: "0", skip: "-50" });
    assert.equal(res.take, 1);
    assert.equal(res.skip, 0);

    const negRes = parsePagination({ take: "-10" });
    assert.equal(negRes.take, 1);
  });

  await t.test("Supports alias parameter names limit and offset", () => {
    const res = parsePagination({ limit: "12", offset: "24" });
    assert.equal(res.take, 12);
    assert.equal(res.skip, 24);
  });

  await t.test("Gives canonical names (take, skip) precedence over aliases (limit, offset)", () => {
    const res = parsePagination({
      take: "18",
      limit: "99",
      skip: "10",
      offset: "99"
    });
    assert.equal(res.take, 18);
    assert.equal(res.skip, 10);
  });

  await t.test("Repairs invalid, NaN, and non-numeric query values safely", () => {
    const res = parsePagination({ take: "invalid", skip: "NaN" });
    assert.equal(res.take, 20);
    assert.equal(res.skip, 0);

    const nullRes = parsePagination({ take: null, skip: undefined });
    assert.equal(nullRes.take, 20);
    assert.equal(nullRes.skip, 0);
  });
});
