import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

const validUser = {
  email: "client@example.com",
  fullName: "Client Example"
};

test("createUserSchema accepts valid user creation payloads", () => {
  const result = createUserSchema.safeParse(validUser);

  assert.equal(result.success, true);
  assert.equal(result.data.role, "client");
});

test("createUserSchema rejects caller-controlled id fields", () => {
  const result = createUserSchema.safeParse({
    ...validUser,
    id: "caller-controlled-id"
  });

  assert.equal(result.success, false);
});

test("createUserSchema rejects admin role assignment", () => {
  const result = createUserSchema.safeParse({
    ...validUser,
    role: "admin"
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "role");
});

test("createUser preserves server-owned id", async () => {
  const result = await createUser({
    ...validUser,
    id: "caller-controlled-id"
  });

  assert.match(result.id, /^usr_/);
  assert.notEqual(result.id, "caller-controlled-id");
});
