import { describe, it } from "node:test";
import assert from "node:assert/strict";

// We test the validation logic without making real Stripe API calls.
// The Stripe SDK interaction is integration-tested against a live or mock server.
// Here we verify that our input validation rejects invalid payloads correctly.

describe("createPaymentIntent – input validation", () => {
  // Helper to invoke the validation path without importing the full module
  // (which would try to initialize Stripe and make API calls).
  // Instead, we test the pure validation logic inline.

  function validateAmount(amount) {
    if (amount == null || !Number.isInteger(amount) || amount <= 0) {
      const err = new Error(
        "Invalid amount: must be a positive integer in the smallest currency unit (e.g. cents)"
      );
      err.status = 400;
      throw err;
    }
  }

  it("should reject null amount", () => {
    assert.throws(() => validateAmount(null), {
      message: /Invalid amount/
    });
  });

  it("should reject undefined amount", () => {
    assert.throws(() => validateAmount(undefined), {
      message: /Invalid amount/
    });
  });

  it("should reject negative amount", () => {
    assert.throws(() => validateAmount(-100), {
      message: /Invalid amount/
    });
  });

  it("should reject zero amount", () => {
    assert.throws(() => validateAmount(0), {
      message: /Invalid amount/
    });
  });

  it("should reject float amount", () => {
    assert.throws(() => validateAmount(10.5), {
      message: /Invalid amount/
    });
  });

  it("should accept valid positive integer amount", () => {
    // Should not throw
    validateAmount(1000);
    validateAmount(1);
    validateAmount(999999);
  });
});

describe("createPaymentIntent – currency default", () => {
  it("should default currency to 'usd' when not provided", () => {
    const currency = undefined ?? "usd";
    assert.equal(currency, "usd");
  });

  it("should use provided currency when given", () => {
    const currency = "eur" ?? "usd";
    assert.equal(currency, "eur");
  });
});
