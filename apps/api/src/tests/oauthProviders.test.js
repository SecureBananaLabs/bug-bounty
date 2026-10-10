import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSupportedOAuthProvider,
  supportedOAuthProviders
} from "../utils/oauthProviders.js";

describe("oauth provider allowlist", () => {
  it("allows only explicitly supported OAuth providers", () => {
    assert.equal(isSupportedOAuthProvider("github"), true);
    assert.equal(isSupportedOAuthProvider("google"), true);
    assert.equal(isSupportedOAuthProvider("not-real"), false);
    assert.equal(isSupportedOAuthProvider("../github"), false);
    assert.equal(isSupportedOAuthProvider(""), false);
  });

  it("returns a stable public provider list", () => {
    assert.deepEqual(supportedOAuthProviders(), ["github", "google"]);
  });
});
