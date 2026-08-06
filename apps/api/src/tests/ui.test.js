import test from "node:test";
import assert from "node:assert";

test("ui package entrypoint validation", async (t) => {
  await t.test("should successfully import Button and Card from @freelanceflow/ui", async () => {
    const { Button, Card } = await import("@freelanceflow/ui");
    assert.ok(Button);
    assert.ok(Card);
    assert.equal(typeof Button, "function");
    assert.equal(typeof Card, "function");
  });
});
