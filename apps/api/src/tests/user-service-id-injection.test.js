import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser ignores caller-supplied id and uses server-generated id", async () => {
  const result = await createUser({ email: "test@example.com", fullName: "Test User", id: "hacked-id" });
  assert.notEqual(result.id, "hacked-id", "caller-supplied id must be ignored");
  assert.ok(result.id.startsWith("usr_"), "id should be server-generated");
});
