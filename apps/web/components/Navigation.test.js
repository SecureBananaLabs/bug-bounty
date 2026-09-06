const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

test("navigation links to implemented core pages", () => {
  const source = readFileSync(join(__dirname, "Navigation.tsx"), "utf8");
  const requiredHrefs = ["/jobs/post", "/billing", "/notifications", "/settings"];

  for (const href of requiredHrefs) {
    assert.ok(source.includes("[\"" + href + "\""), href);
  }
});
