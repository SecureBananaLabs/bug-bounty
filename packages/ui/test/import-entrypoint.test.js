const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const test = require("node:test");

const requireFromTest = createRequire(__filename);

test("@freelanceflow/ui resolves and exports runtime components", async () => {
  const resolvedPath = requireFromTest.resolve("@freelanceflow/ui");
  assert.match(resolvedPath, /packages[/\\]ui[/\\]index\.js$/);

  const requiredPackage = requireFromTest("@freelanceflow/ui");
  assert.equal(typeof requiredPackage.Button, "function");
  assert.equal(typeof requiredPackage.Card, "function");

  const importedPackage = await import("@freelanceflow/ui");
  assert.equal(typeof importedPackage.Button, "function");
  assert.equal(typeof importedPackage.Card, "function");
  assert.equal(typeof importedPackage.default.Button, "function");
  assert.equal(typeof importedPackage.default.Card, "function");

  const button = requiredPackage.Button({ children: "Hire" });
  assert.equal(button.type, "button");
  assert.equal(button.props.children, "Hire");

  const card = requiredPackage.Card({ title: "Milestone", children: "Funded" });
  assert.equal(card.type, "section");
  assert.equal(card.props.children[0].type, "h3");
});
