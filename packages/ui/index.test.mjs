import assert from "node:assert/strict";
import test from "node:test";
import { Button, Card } from "@freelanceflow/ui";

test("exports Node-loadable React components", () => {
  const button = Button({ children: "Post job" });
  const card = Card({ title: "Overview", children: "Pipeline" });

  assert.equal(button.type, "button");
  assert.equal(button.props.children, "Post job");
  assert.equal(card.type, "section");
  assert.equal(card.props.children[0].type, "h3");
  assert.equal(card.props.children[0].props.children, "Overview");
});
