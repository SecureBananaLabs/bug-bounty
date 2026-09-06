// Machin's formula: pi = 16 arctan(1/5) - 4 arctan(1/239).
//
// This oracle shares no code with the generator, so agreement between the two
// is evidence rather than tautology. It is quadratic in the digit count and
// therefore slow. That is acceptable: its job is to disagree with Chudnovsky
// if Chudnovsky is wrong, not to compete on speed.

const MAX_DIGITS = 5000;

export function machinPi(digits) {
  assertDigitCount(digits);

  const guardDigits = guardFor(digits);
  const scale = 10n ** BigInt(digits + guardDigits);
  const scaled = 16n * arctanInverse(5n, scale) - 4n * arctanInverse(239n, scale);

  return format(scaled / 10n ** BigInt(guardDigits), digits);
}

// arctan(1/x) = sum (-1)^k / ((2k + 1) x^(2k + 1)), evaluated in fixed point.
// The running power is divided by x squared each step rather than raised from
// scratch, so a term costs two small divisions.
function arctanInverse(x, scale) {
  const xSquared = x * x;
  let power = scale / x;
  let sum = 0n;
  let k = 0n;

  while (power !== 0n) {
    const term = power / (2n * k + 1n);
    sum += k % 2n === 0n ? term : -term;
    power /= xSquared;
    k += 1n;
  }

  return sum;
}

// Each term loses under one unit to truncation and the series gains
// 2 log10(x) digits per term, so the total loss is bounded by a small multiple
// of the term count. Ten digits cover the fixed losses and the logarithmic
// part covers the rest.
function guardFor(digits) {
  return 10 + Math.ceil(Math.log10(digits + 10));
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

  if (digits > MAX_DIGITS) {
    throw new RangeError(`machinPi is limited to ${MAX_DIGITS} digits`);
  }
}
