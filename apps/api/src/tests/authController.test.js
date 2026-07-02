import test from "node:test";
import assert from "node:assert/strict";
import { handleAuthRequest } from "../controllers/authController.js";

test("handleAuthRequest forwards rejected async auth errors to next", async () => {
  const expected = new Error("auth service failed");
  let received;

  const next = (error) => {
    received = error;
    return "forwarded";
  };

  const result = await handleAuthRequest(next, async () => {
    throw expected;
  });

  assert.equal(result, "forwarded");
  assert.equal(received, expected);
});
