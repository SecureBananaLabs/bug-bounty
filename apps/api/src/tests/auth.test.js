import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { registerUser } from "../services/authService.js";

test("registerUser: token sub matches returned user id", async () => {
  const result = await registerUser({ email: "test@example.com", password: "secret123", role: "client" });

  assert.ok(result.id, "result.id should be present");
  assert.ok(result.token, "result.token should be present");

  const decoded = jwt.decode(result.token);
  assert.equal(
    decoded.sub,
    result.id,
    `JWT sub '${decoded.sub}' should equal result.id '${result.id}'`
  );
});
