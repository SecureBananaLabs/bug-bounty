import test from "node:test";
import assert from "node:assert/strict";
import { validateCreateNotification } from "./notification.js";

test("accepts a complete notification and trims the strings", () => {
  const result = validateCreateNotification({
    userId: " usr_1 ",
    title: " Invoice paid ",
    body: " Payment cleared for job 42 "
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.data, {
    userId: "usr_1",
    title: "Invoice paid",
    body: "Payment cleared for job 42"
  });
});

test("rejects a payload with missing fields", () => {
  for (const payload of [{}, { title: "Hi there" }, { userId: "usr_1" }]) {
    const result = validateCreateNotification(payload);

    assert.equal(result.valid, false);
    assert.equal(typeof result.message, "string");
  }
});

test("rejects a title or body shorter than two characters", () => {
  const shortTitle = validateCreateNotification({
    userId: "usr_1",
    title: "a",
    body: "A real body"
  });
  const shortBody = validateCreateNotification({
    userId: "usr_1",
    title: "A real title",
    body: " b "
  });

  assert.equal(shortTitle.valid, false);
  assert.equal(shortBody.valid, false);
});

test("rejects whitespace-only strings", () => {
  const result = validateCreateNotification({
    userId: "   ",
    title: "A real title",
    body: "A real body"
  });

  assert.equal(result.valid, false);
});
