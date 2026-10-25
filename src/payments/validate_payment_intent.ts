/**
 * fix(payments): reject non-positive payment intent amounts (#12407)
 *
 * BUG
 * ---
 * The payment-intent creation path accepted any numeric `amount` value,
 * including 0, negative numbers, and non-finite values (NaN / Infinity).
 * A zero or negative amount lets a caller create a "payment" that moves
 * no funds (or, if later arithmetic is applied, inverts the sign of a
 * balance) while still being treated as a valid, settleable intent.
 *
 * FIX
 * ---
 * Validate `amount` at the boundary, before any intent object is built:
 *   1. must be a finite number (rejects NaN, Infinity, -Infinity)
 *   2. must be strictly greater than zero
 *   3. must be representable in integer minor units (no sub-cent dust)
 *
 * The validation is a pure function so it can be unit-tested and reused
 * by every call site (REST handler, internal service, cron reconciler).
 */

export class InvalidPaymentAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPaymentAmountError";
    Object.setPrototypeOf(this, InvalidPaymentAmountError.prototype);
  }
}

/** Minor units per major unit for the supported settlement currencies. */
const MINOR_UNITS: Record<string, number> = {
  USD: 100, // cents
  USDC: 1_000_000, // 6 decimals
  EUR: 100,
};

export interface PaymentIntentInput {
  amount: number | string;
  currency?: string;
}

/**
 * Returns the amount expressed in integer minor units, or throws
 * InvalidPaymentAmountError if the amount is not a strictly positive,
 * finite, exactly-representable value.
 */
export function normalizePaymentAmount(
  rawAmount: number | string,
  currency = "USDC",
): bigint {
  if (rawAmount === null || rawAmount === undefined || rawAmount === "") {
    throw new InvalidPaymentAmountError("amount is required");
  }

  const amount =
    typeof rawAmount === "string" ? Number(rawAmount.trim()) : rawAmount;

  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new InvalidPaymentAmountError(
      `amount must be a finite number, received: ${String(rawAmount)}`,
    );
  }

  if (amount <= 0) {
    throw new InvalidPaymentAmountError(
      `amount must be strictly positive, received: ${amount}`,
    );
  }

  const scale = MINOR_UNITS[currency.toUpperCase()];
  if (scale === undefined) {
    throw new InvalidPaymentAmountError(`unsupported currency: ${currency}`);
  }

  // Convert to minor units and require an exact integer result so that
  // sub-cent / sub-micro dust can never silently truncate to zero.
  const minor = amount * scale;
  if (!Number.isInteger(minor)) {
    throw new InvalidPaymentAmountError(
      `amount ${amount} ${currency} has more precision than the currency supports`,
    );
  }

  const minorBig = BigInt(minor);
  if (minorBig <= 0n) {
    throw new InvalidPaymentAmountError(
      `amount ${amount} ${currency} rounds to zero minor units`,
    );
  }

  return minorBig;
}

/** Guard usable directly inside a request handler. */
export function assertValidPaymentIntent(input: PaymentIntentInput): void {
  normalizePaymentAmount(input.amount, input.currency ?? "USDC");
}

/* ------------------------------------------------------------------ */
/* Tests (jest / vitest compatible)                                    */
/* ------------------------------------------------------------------ */
if (typeof describe === "function") {
  describe("normalizePaymentAmount", () => {
    it("accepts a positive amount and returns minor units", () => {
      expect(normalizePaymentAmount(10, "USDC")).toBe(10_000_000n);
      expect(normalizePaymentAmount("2.5", "USD")).toBe(250n);
    });

    it("rejects zero", () => {
      expect(() => normalizePaymentAmount(0)).toThrow(InvalidPaymentAmountError);
    });

    it("rejects negative amounts", () => {
      expect(() => normalizePaymentAmount(-1)).toThrow(InvalidPaymentAmountError);
      expect(() => normalizePaymentAmount("-0.01")).toThrow(
        InvalidPaymentAmountError,
      );
    });

    it("rejects non-finite values", () => {
      expect(() => normalizePaymentAmount(NaN)).toThrow(InvalidPaymentAmountError);
      expect(() => normalizePaymentAmount(Infinity)).toThrow(
        InvalidPaymentAmountError,
      );
    });

    it("rejects empty / missing values", () => {
      expect(() => normalizePaymentAmount("")).toThrow(InvalidPaymentAmountError);
      // @ts-expect-error deliberate invalid input
      expect(() => normalizePaymentAmount(undefined)).toThrow(
        InvalidPaymentAmountError,
      );
    });

    it("rejects sub-unit precision that would truncate to zero", () => {
      expect(() => normalizePaymentAmount(0.0000001, "USDC")).toThrow(
        InvalidPaymentAmountError,
      );
    });
  });
}
