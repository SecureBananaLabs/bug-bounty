import { describe, it } from "node:test";
import { strict as assert } from "assert";
import { registerUser } from "../services/authService.js";

describe("authService", () => {
  it("registerUser should return a token with the correct subject", async () => {
    const payload = { email: "test@example.com", role: "client" };
    const result = await registerUser(payload);

    assert.ok(result.token, "Token should be generated");
    const tokenPayload = JSON.parse(
      Buffer.from(result.token.split(".")[1], "base64").toString()
    );
    assert.equal(
      tokenPayload.sub,
      result.id,
      "Token subject should match the returned user ID"
    );
  });
});
