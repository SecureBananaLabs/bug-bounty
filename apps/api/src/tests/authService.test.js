import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";

test("registerUser returns matching id and token sub", async () => {
  const result = await registerUser({ email: "test@example.com", role: "client" });
  // id should start with "usr_"
  assert.ok(result.id.startsWith("usr_"), "id should start with usr_");
  // token sub should match id exactly
  const tokenParts = result.token.split(".");
  assert.equal(tokenParts.length, 3, "token should have 3 parts");
  const payload = JSON.parse(Buffer.from(tokenParts[1], "base64url").toString());
  assert.equal(payload.sub, result.id, "token sub must match returned id");
});

test("registerUser id and token sub match even when time advances", async () => {
  // Call Date.now() multiple times to make time advance between id generation and token signing
  // Simulate a slow operation
  const origDateNow = Date.now;
  let callCount = 0;
  const timestamps = [1000000, 1000100]; // simulate 100ms gap
  Date.now = () => {
    const val = timestamps[callCount] ?? timestamps[timestamps.length - 1] + callCount;
    callCount++;
    return val;
  };

  try {
    const result = await registerUser({ email: "test2@example.com", role: "admin" });
    const tokenParts = result.token.split(".");
    const payload = JSON.parse(Buffer.from(tokenParts[1], "base64url").toString());
    assert.equal(payload.sub, result.id, "token sub must match returned id even with time gap");
  } finally {
    Date.now = origDateNow;
  }
});
