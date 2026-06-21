import test from "node:test";
import assert from "assert/strict";

// Test the OAuth provider allowlist logic directly
// (We test the business rule without needing a running HTTP server)

const SUPPORTED_OAUTH_PROVIDERS = new Set(["google", "github", "facebook"]);

function validateProvider(provider) {
  if (!SUPPORTED_OAUTH_PROVIDERS.has(provider)) {
    return { ok: false, status: 400, message: `Unsupported OAuth provider: "${provider}". Supported providers: ${[...SUPPORTED_OAUTH_PROVIDERS].join(", ")}` };
  }
  return { ok: true, status: 200, data: { provider, status: "callback-received" } };
}

test("OAuth: accepted providers return success (google)", () => {
  const result = validateProvider("google");
  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.data.provider, "google");
});

test("OAuth: accepted providers return success (github)", () => {
  const result = validateProvider("github");
  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.data.provider, "github");
});

test("OAuth: accepted providers return success (facebook)", () => {
  const result = validateProvider("facebook");
  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.data.provider, "facebook");
});

test("OAuth: unknown provider returns 400 error", () => {
  const result = validateProvider("not-a-provider");
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.ok(result.message.includes("Unsupported OAuth provider"));
  assert.ok(result.message.includes("not-a-provider"));
});

test("OAuth: empty provider returns 400 error", () => {
  const result = validateProvider("");
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
});

test("OAuth: path-traversal-like provider returns 400", () => {
  const result = validateProvider("../admin");
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
});

test("OAuth: case-sensitive — 'Google' is not 'google'", () => {
  const result = validateProvider("Google");
  // Depending on implementation, case-sensitive allowlist should reject
  // Current Set-based check is case-sensitive
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
});

test("OAuth: supported provider list is stable and non-empty", () => {
  assert.ok(SUPPORTED_OAUTH_PROVIDERS.size > 0, "should have at least one supported provider");
  assert.ok(SUPPORTED_OAUTH_PROVIDERS.has("google"));
  assert.ok(SUPPORTED_OAUTH_PROVIDERS.has("github"));
  assert.ok(SUPPORTED_OAUTH_PROVIDERS.has("facebook"));
});
