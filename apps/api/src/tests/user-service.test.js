import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("listUsers returns a defensive array snapshot", async () => {
  await createUser({ email: "snapshot@example.com" });

  const firstResult = await listUsers();
  firstResult.length = 0;
  firstResult.push({ id: "injected" });

  const secondResult = await listUsers();

  assert.ok(secondResult.some((user) => user.email === "snapshot@example.com"));
  assert.equal(secondResult.some((user) => user.id === "injected"), false);
});
