import test from "node:test";
import assert from "node:assert/strict";
import { Button, Card } from "@freelanceflow/ui";

test("@freelanceflow/ui exposes runtime component exports", () => {
  assert.equal(typeof Button, "function");
  assert.equal(typeof Card, "function");

  const button = Button({ children: "Post job" });
  assert.equal(button.type, "button");
  assert.equal(button.props.children, "Post job");

  const card = Card({ title: "Profile", children: "Ready" });
  assert.equal(card.type, "section");
  assert.equal(card.props.children[0].type, "h3");
  assert.equal(card.props.children[0].props.children, "Profile");
});
