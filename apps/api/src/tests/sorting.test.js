import test from "node:test";
import assert from "node:assert/strict";
import { parseSorting, normalizeOrder } from "../utils/sorting.js";

test("Safe query sorting utility test suite", async (t) => {
  await t.test("Returns default sorting when query is empty or undefined", () => {
    const res1 = parseSorting();
    assert.equal(res1.field, "createdAt");
    assert.equal(res1.order, "asc");
    assert.equal(res1.sortBy, "createdAt");
    assert.equal(res1.sortOrder, "asc");
    assert.equal(res1.direction, "asc");
    assert.deepEqual(res1.orderBy, { createdAt: "asc" });

    const res2 = parseSorting({});
    assert.equal(res2.field, "createdAt");
    assert.equal(res2.order, "asc");

    const res3 = parseSorting(null);
    assert.equal(res3.field, "createdAt");
    assert.equal(res3.order, "asc");

    const res4 = parseSorting(undefined);
    assert.equal(res4.field, "createdAt");
    assert.equal(res4.order, "asc");
  });

  await t.test("Defaults to first allowed field when defaultField is omitted", () => {
    const res = parseSorting({}, ["title", "budget", "createdAt"]);
    assert.equal(res.field, "title");
    assert.equal(res.order, "asc");
  });

  await t.test("Respects custom defaultField and defaultOrder parameters", () => {
    const res = parseSorting(
      {},
      ["title", "budget", "createdAt"],
      "createdAt",
      "desc"
    );
    assert.equal(res.field, "createdAt");
    assert.equal(res.order, "desc");
    assert.deepEqual(res.orderBy, { createdAt: "desc" });
  });

  await t.test("Parses standard sortBy and sortOrder query parameters", () => {
    const res = parseSorting(
      { sortBy: "budget", sortOrder: "desc" },
      ["title", "budget", "createdAt"]
    );
    assert.equal(res.field, "budget");
    assert.equal(res.order, "desc");
    assert.equal(res.sortBy, "budget");
    assert.equal(res.sortOrder, "desc");
  });

  await t.test("Supports query parameter aliases: sort, order, field, direction, orderBy, dir", () => {
    const res1 = parseSorting({ sort: "budget", order: "desc" }, ["budget"]);
    assert.equal(res1.field, "budget");
    assert.equal(res1.order, "desc");

    const res2 = parseSorting(
      { field: "budget", direction: "asc" },
      ["budget"]
    );
    assert.equal(res2.field, "budget");
    assert.equal(res2.order, "asc");

    const res3 = parseSorting(
      { orderBy: "budget", dir: "desc" },
      ["budget"]
    );
    assert.equal(res3.field, "budget");
    assert.equal(res3.order, "desc");
  });

  await t.test("Prioritizes canonical sortBy over sort/field aliases", () => {
    const res = parseSorting(
      { sortBy: "budget", sort: "title", field: "createdAt" },
      ["title", "budget", "createdAt"]
    );
    assert.equal(res.field, "budget");
  });

  await t.test("Normalizes sort directions across diverse casing and formats", () => {
    assert.equal(normalizeOrder("ASC"), "asc");
    assert.equal(normalizeOrder("DESC"), "desc");
    assert.equal(normalizeOrder("Ascending"), "asc");
    assert.equal(normalizeOrder("descending"), "desc");
    assert.equal(normalizeOrder("ascend"), "asc");
    assert.equal(normalizeOrder("descend"), "desc");
    assert.equal(normalizeOrder("1"), "asc");
    assert.equal(normalizeOrder("-1"), "desc");
    assert.equal(normalizeOrder("+1"), "asc");
    assert.equal(normalizeOrder(1), "asc");
    assert.equal(normalizeOrder(-1), "desc");

    // Invalid values fall back safely to fallback parameter
    assert.equal(normalizeOrder("invalid", "desc"), "desc");
    assert.equal(normalizeOrder("unknown", "asc"), "asc");
    assert.equal(normalizeOrder(null, "desc"), "desc");
  });

  await t.test("Strictly enforces whitelist: rejects unpermitted fields and SQL injection attempts", () => {
    const allowed = ["title", "status", "createdAt"];

    // Unallowed column name
    const unallowed = parseSorting(
      { sortBy: "password_hash" },
      allowed,
      "createdAt",
      "desc"
    );
    assert.equal(unallowed.field, "createdAt");
    assert.equal(unallowed.order, "desc");

    // SQL injection attempt
    const sqlInjection = parseSorting(
      { sortBy: "title; DROP TABLE users; --" },
      allowed,
      "title"
    );
    assert.equal(sqlInjection.field, "title");

    // Prototype pollution attempts
    const proto1 = parseSorting({ sortBy: "__proto__" }, allowed, "createdAt");
    assert.equal(proto1.field, "createdAt");

    const proto2 = parseSorting(
      { sortBy: "constructor" },
      allowed,
      "createdAt"
    );
    assert.equal(proto2.field, "createdAt");

    const proto3 = parseSorting({ sortBy: "toString" }, allowed, "createdAt");
    assert.equal(proto3.field, "createdAt");
  });

  await t.test("Matches allowed fields case-insensitively and returns canonical casing", () => {
    const allowed = ["createdAt", "jobTitle"];
    const res1 = parseSorting({ sortBy: "createdat" }, allowed);
    assert.equal(res1.field, "createdAt");

    const res2 = parseSorting({ sortBy: "JOBTITLE" }, allowed);
    assert.equal(res2.field, "jobTitle");
  });

  await t.test("Parses compound sort strings with prefixes and delimiters", () => {
    const allowed = ["title", "createdAt", "rating"];

    // Prefix '-' denotes desc
    const neg = parseSorting({ sort: "-createdAt" }, allowed);
    assert.equal(neg.field, "createdAt");
    assert.equal(neg.order, "desc");

    // Prefix '+' denotes asc
    const pos = parseSorting({ sort: "+title" }, allowed);
    assert.equal(pos.field, "title");
    assert.equal(pos.order, "asc");

    // Colon delimiter 'field:order'
    const colon = parseSorting({ sort: "rating:desc" }, allowed);
    assert.equal(colon.field, "rating");
    assert.equal(colon.order, "desc");

    // Space delimiter 'field order'
    const space = parseSorting({ sort: "rating desc" }, allowed);
    assert.equal(space.field, "rating");
    assert.equal(space.order, "desc");

    // Comma delimiter 'field,order'
    const comma = parseSorting({ sort: "rating,asc" }, allowed);
    assert.equal(comma.field, "rating");
    assert.equal(comma.order, "asc");
  });

  await t.test("Handles combined prefix and suffix notations", () => {
    const allowed = ["title", "createdAt"];
    const res1 = parseSorting({ sortBy: "-createdAt desc" }, allowed);
    assert.equal(res1.field, "createdAt");
    assert.equal(res1.order, "desc");

    const res2 = parseSorting({ sortBy: "+title asc" }, ["budget", "title"]);
    assert.equal(res2.field, "title");
    assert.equal(res2.order, "asc");
  });

  await t.test("Handles comma-separated multi-field strings by parsing primary sort", () => {
    const allowed = ["id", "title", "createdAt"];
    const res1 = parseSorting({ sortBy: "-title, +createdAt" }, allowed);
    assert.equal(res1.field, "title");
    assert.equal(res1.order, "desc");

    const res2 = parseSorting({ sortBy: "createdAt asc, title desc" }, allowed);
    assert.equal(res2.field, "createdAt");
    assert.equal(res2.order, "asc");
  });

  await t.test("Parses raw string queries directly and handles all alias keys in URL format", () => {
    const allowed = ["price", "date", "title"];

    const str1 = parseSorting("-price", allowed);
    assert.equal(str1.field, "price");
    assert.equal(str1.order, "desc");

    const str2 = parseSorting("price:asc", allowed);
    assert.equal(str2.field, "price");
    assert.equal(str2.order, "asc");

    const urlParams1 = parseSorting(
      "sortBy=price&sortOrder=desc",
      allowed
    );
    assert.equal(urlParams1.field, "price");
    assert.equal(urlParams1.order, "desc");

    // URL parameter aliases without leading '?' or '&'
    const urlParams2 = parseSorting(
      "orderBy=title",
      ["budget", "title"]
    );
    assert.equal(urlParams2.field, "title");
    assert.equal(urlParams2.order, "asc");

    const urlParams3 = parseSorting(
      "?order_by=price&order=desc",
      allowed
    );
    assert.equal(urlParams3.field, "price");
    assert.equal(urlParams3.order, "desc");
  });

  await t.test("Supports allowedFields passed as a Set or Object", () => {
    const setAllowed = new Set(["title", "createdAt"]);
    const resSet = parseSorting(
      { sortBy: "title", sortOrder: "desc" },
      setAllowed
    );
    assert.equal(resSet.field, "title");
    assert.equal(resSet.order, "desc");

    const objAllowed = { title: true, createdAt: true };
    const resObj = parseSorting(
      { sortBy: "createdAt", sortOrder: "asc" },
      objAllowed
    );
    assert.equal(resObj.field, "createdAt");
    assert.equal(resObj.order, "asc");
  });

  await t.test("Trims whitespace from query parameters", () => {
    const allowed = ["title", "createdAt"];
    const res = parseSorting(
      { sortBy: "  title  ", sortOrder: "  DESC  " },
      allowed
    );
    assert.equal(res.field, "title");
    assert.equal(res.order, "desc");
  });

  await t.test("Handles array query parameters gracefully with uppercase/varied directions and array orders", () => {
    const allowed = ["title", "createdAt"];

    const res1 = parseSorting(
      { sortBy: ["title", "desc"] },
      allowed
    );
    assert.equal(res1.field, "title");
    assert.equal(res1.order, "desc");

    // Uppercase 'DESC' in array parameter
    const res2 = parseSorting(
      { sortBy: ["title", "DESC"] },
      allowed
    );
    assert.equal(res2.field, "title");
    assert.equal(res2.order, "desc");

    // Numeric direction in array parameter
    const res3 = parseSorting(
      { sortBy: ["title", -1] },
      allowed
    );
    assert.equal(res3.field, "title");
    assert.equal(res3.order, "desc");

    // Array sortOrder parameter
    const res4 = parseSorting(
      { sortBy: "title", sortOrder: ["desc"] },
      allowed
    );
    assert.equal(res4.field, "title");
    assert.equal(res4.order, "desc");

    // Query itself passed as array
    const res5 = parseSorting(["title", "desc"], allowed);
    assert.equal(res5.field, "title");
    assert.equal(res5.order, "desc");
  });

  await t.test("Handles empty allowedFields by safely returning defaultField", () => {
    const res = parseSorting({ sortBy: "unknownField" }, [], "customDefault", "desc");
    assert.equal(res.field, "customDefault");
    assert.equal(res.order, "desc");
  });

  await t.test("Handles invalid and non-string inputs across all parameters without throwing", () => {
    assert.doesNotThrow(() => {
      parseSorting(12345, null, null, null);
      parseSorting(true, undefined, undefined, "invalidOrder");
      parseSorting({ sortBy: 999 }, ["999"]);
      parseSorting({}, [], 42, -1);
      parseSorting([], null);
      parseSorting({}, [null, undefined, ""]);
    });
    const resNum = parseSorting({}, [], 42, -1);
    assert.equal(resNum.field, "42");
    assert.equal(resNum.order, "desc");
  });
});
