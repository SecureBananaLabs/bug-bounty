import { isqrt } from "./isqrt.js";

// Chudnovsky series constants.
const LINEAR_TERM = 13591409n;
const LINEAR_INCREMENT = 545140134n;
const CUBE_OVER_24 = 10939058860032000n;
const FINAL_MULTIPLIER = 426880n;
const ROOT_OPERAND = 10005n;

// Each term contributes log10(640320^3 / 24) / 3 decimal digits, a fixed rate
// because the series converges linearly.
const DIGITS_PER_TERM = 14.181647462725477;

const TEN = 10n;

export function computePi(digits) {
  assertDigitCount(digits);

  return computePiWithGuard(digits, defaultGuardDigits(digits));
}

export function computePiWithGuard(digits, guardDigits) {
  assertDigitCount(digits);
  assertGuardDigits(guardDigits);

  const precision = digits + guardDigits;
  const { q, t } = binarySplit(0, termCount(precision));

  // Every value above is an exact integer, so the only losses in the whole
  // computation are the three truncations here: the series tail, the square
  // root and the division. The guard digits exist to absorb them.
  const scale = TEN ** BigInt(precision);
  const root = isqrt(ROOT_OPERAND * scale * scale);
  const scaled = (FINAL_MULTIPLIER * root * q) / t;

  return format(scaled / TEN ** BigInt(guardDigits), digits);
}

export function defaultGuardDigits(digits) {
  assertDigitCount(digits);

  // Ten digits cover the fixed truncation losses. The logarithmic part grows
  // with the term count so that the truncated tail stays below the last kept
  // digit as the request grows. The remaining five are slack.
  return 15 + Math.ceil(Math.log10(termCount(digits) + 1));
}

// Binary splitting over the half-open term range [a, b). The triple satisfies
// the usual recurrence, so a range merges with three multiplications and one
// addition and the operands grow evenly rather than one running away.
function binarySplit(a, b) {
  if (b - a === 1) {
    return singleTerm(a);
  }

  const mid = (a + b) >> 1;
  const left = binarySplit(a, mid);
  const right = binarySplit(mid, b);

  return {
    p: left.p * right.p,
    q: left.q * right.q,
    t: left.t * right.q + left.p * right.t
  };
}

function singleTerm(k) {
  if (k === 0) {
    return { p: 1n, q: 1n, t: LINEAR_TERM };
  }

  const n = BigInt(k);
  const p = (6n * n - 5n) * (2n * n - 1n) * (6n * n - 1n);
  const q = n * n * n * CUBE_OVER_24;
  const t = p * (LINEAR_TERM + LINEAR_INCREMENT * n);

  // The series alternates in sign.
  return { p, q, t: k % 2 === 0 ? t : -t };
}

function termCount(precision) {
  return Math.floor(precision / DIGITS_PER_TERM) + 1;
}

function format(value, digits) {
  const text = value.toString();
  if (digits === 0) {
    return text;
  }

  return text.slice(0, 1) + "." + text.slice(1);
}

function assertDigitCount(digits) {
  if (typeof digits !== "number" || !Number.isInteger(digits)) {
    throw new TypeError("digits must be an integer");
  }

  if (digits < 0) {
    throw new RangeError("digits must not be negative");
  }
}

function assertGuardDigits(guardDigits) {
  if (typeof guardDigits !== "number" || !Number.isInteger(guardDigits)) {
    throw new TypeError("guardDigits must be an integer");
  }

  if (guardDigits < 1) {
    throw new RangeError("guardDigits must be at least 1");
  }
}
