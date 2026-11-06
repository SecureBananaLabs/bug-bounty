import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("user service returns defensive copies of stored users", async () => {
  const created = await createUser({
    name: "Alex Client",
    email: "alex@example.com",
    role: "client",
  });

  created.name = "mutated returned user";

  const firstList = await listUsers();
  const storedUser = firstList.find((user) => user.id === created.id);

  assert.equal(storedUser.name, "Alex Client");

  firstList.push({ id: "usr_fake", name: "injected" });
  storedUser.name = "mutated list user";

  const secondList = await listUsers();
  const preservedUser = secondList.find((user) => user.id === created.id);

  assert.equal(secondList.some((user) => user.id === "usr_fake"), false);
  assert.equal(preservedUser.name, "Alex Client");
});
