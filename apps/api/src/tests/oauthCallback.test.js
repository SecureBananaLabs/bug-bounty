import test from "node:test";
import assert from "node:assert/strict";
import { oauthCallback } from "../controllers/authController.js";

function createResponse() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test("oauthCallback rejects callbacks without an authorization code", async () => {
  for (const code of [undefined, "", "   "]) {
    const res = createResponse();

    await oauthCallback({ params: { provider: "github" }, query: { code } }, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      success: false,
      message: "OAuth callback requires an authorization code"
    });
  }
});

test("oauthCallback accepts callbacks with a non-empty authorization code", async () => {
  const res = createResponse();

  await oauthCallback({ params: { provider: "github" }, query: { code: "abc123" } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    success: true,
    data: {
      provider: "github",
      status: "callback-received"
    }
  });
});
