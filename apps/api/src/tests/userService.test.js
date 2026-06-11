import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser preserves the generated user id over payload id", async () => {
  const user = await createUser({
    id: "usr_client_supplied",
    name: "Payload Name",
    email: "payload@example.com",
  });

  assert.match(user.id, /^usr_\d+$/);
  assert.notEqual(user.id, "usr_client_supplied");
  assert.equal(user.name, "Payload Name");
  assert.equal(user.email, "payload@example.com");

  const stored = (await listUsers()).find((entry) => entry.email === "payload@example.com");
  assert.equal(stored?.id, user.id);
});