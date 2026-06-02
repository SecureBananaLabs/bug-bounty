import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";

test("registerUser preserves the validated fullName in the response", async () => {
  const payload = { email: "a@b.com", password: "secret123", fullName: "Rakha Qushayyi", role: "client" };
  const result = await registerUser(payload);

  assert.equal(result.fullName, "Rakha Qushayyi");
});