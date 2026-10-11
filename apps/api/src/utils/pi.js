/**
 * Compute pi to an arbitrary number of decimal places.
 *
 * Note: pi is irrational, so it has no "last decimal place" — an exact
 * finite representation is impossible. This function instead computes
 * pi to any requested precision using the Chudnovsky algorithm with
 * BigInt arithmetic.
 *
 * @param {number} decimals - number of decimal places to compute (>= 0)
 * @returns {string} pi as a decimal string, e.g. "3.14159..."
 */
export function computePi(decimals) {
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new RangeError("decimals must be a non-negative integer");
  }

  // Extra guard digits to absorb truncation error, then trim.
  const guard = 10;
  const digits = decimals + guard;

  // Chudnovsky: 1/pi = 12 * sum_{k=0..inf} (-1)^k (6k)! (13591409 + 545140134k)
  //              / ((3k)! (k!)^3 640320^(3k + 3/2))
  // Each term adds ~14 decimal digits of precision.
  const terms = Math.ceil(digits / 14) + 1;
  const C = 426880n;
  const C3_OVER_24 = 545140134n;
  const A = 13591409n;
  const B = 545140134n;
  const DEN_POW = 640320n ** 3n; // 262537412640768000

  // Scale factor: 10^digits fixed-point.
  const scale = 10n ** BigInt(digits);

  let sum = 0n;
  let term = scale; // k = 0 term: (545140134*0 + 13591409) * 10^digits
  sum += A * scale;

  let k = 1n;
  const total = BigInt(terms);
  while (k <= total) {
    // term(k) = term(k-1) * (-(6k-5)(2k-1)(6k-1)) / (k^3 * 640320^3)
    const numerator =
      (6n * k - 5n) * (2n * k - 1n) * (6n * k - 1n);
    const denominator = k ** 3n * DEN_POW;
    term = (term * -numerator) / denominator;
    sum += (A + B * k) * term;
    k += 1n;
  }

  // pi = 426880 * sqrt(10005) / sum, computed in fixed point.
  // Use integer sqrt of 10005 * 10^(2*digits) for the scaled sqrt.
  const sqrtArg = 10005n * scale * scale;
  const sqrt10005 = isqrt(sqrtArg);

  const piScaled = (C * sqrt10005) / sum;

  return formatFixed(piScaled, digits, decimals);
}

/** Integer square root via Newton's method. */
function isqrt(n) {
  if (n < 0n) throw new RangeError("negative input");
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

/** Render a fixed-point BigInt, trimming to the requested decimals. */
function formatFixed(value, computedDigits, decimals) {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const s = abs.toString().padStart(computedDigits + 1, "0");
  const intPart = s.slice(0, s.length - computedDigits);
  let fracPart = s.slice(s.length - computedDigits).slice(0, decimals);
  if (fracPart.length < decimals) {
    fracPart = fracPart.padEnd(decimals, "0");
  }
  const body = decimals === 0 ? intPart : `${intPart}.${fracPart}`;
  return negative ? `-${body}` : body;
}
