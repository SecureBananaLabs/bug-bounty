const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const componentPath = join(__dirname, "Navigation.tsx");
const layoutPath = join(__dirname, "../app/layout.tsx");

test("default navigation does not expose the admin link", () => {
  const source = readFileSync(componentPath, "utf8");
  const publicLinksStart = source.indexOf("const publicLinks");
  const adminLinkStart = source.indexOf("const adminLink");

  assert.notEqual(publicLinksStart, -1);
  assert.notEqual(adminLinkStart, -1);

  const publicLinksBlock = source.slice(publicLinksStart, adminLinkStart);

  assert.ok(!publicLinksBlock.includes('"/admin"'));
  assert.ok(source.includes('const adminLink: NavigationLink = ["/admin", "Admin"];'));
  assert.ok(source.includes('currentUserRole === "admin"'));
});

test("root layout renders visitor navigation without admin role", () => {
  const source = readFileSync(layoutPath, "utf8");

  assert.ok(source.includes("<Navigation />"));
  assert.ok(!source.includes("currentUserRole="));
});
