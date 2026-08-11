const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const source = readFileSync(join(__dirname, "Navigation.tsx"), "utf8");

test("global navigation links to implemented core pages", () => {
  for (const href of ["/jobs/post", "/notifications", "/billing", "/settings"]) {
    assert.match(source, new RegExp(`\\["${href}",`));
  }
});
