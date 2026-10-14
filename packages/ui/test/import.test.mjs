import assert from "node:assert/strict";
import { test } from "node:test";
import { Button, Card } from "@freelanceflow/ui";

test("@freelanceflow/ui can be imported through the package name", () => {
  assert.equal(typeof Button, "function");
  assert.equal(typeof Card, "function");

  const button = Button({ children: "Create proposal" });
  assert.equal(button.type, "button");
  assert.equal(button.props.children, "Create proposal");

  const card = Card({ title: "Milestones", children: "Two active milestones" });
  assert.equal(card.type, "section");
  assert.equal(card.props.children[0].type, "h3");
});
