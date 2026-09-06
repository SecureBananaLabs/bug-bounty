// The Bailey-Borwein-Plouffe formula:
//
//   pi = sum over k of 16^-k (4/(8k+1) - 2/(8k+4) - 1/(8k+5) - 1/(8k+6))
//
// Multiplying by 16^(position - 1) and keeping the fractional part leaves the
// hexadecimal digits from that position onwards, so a digit can be audited
// without computing any digit before it. This is the oracle that scales: it
// can probe position 50,000 without producing the first 49,999.
//
// The head of each sum is reduced with exact modular arithmetic rather than
// floating point, so the only loss is the truncation of one fixed-point
// division per term. Those losses still accumulate, which is the known
// limitation of the method: only the leading digits of a probe are
// trustworthy, and a comparison must use those and not the full width of the
// fixed-point value. MARGIN below buys eight hexadecimal digits of headroom
// beyond the accumulated loss, and MAX_DIGITS keeps a caller from asking for
// more than that headroom can support.

const TERMS = [
  { offset: 1n, weight: 4n },
  { offset: 4n, weight: -2n },
  { offset: 5n, weight: -1n },
  { offset: 6n, weight: -1n }
];

const MAX_DIGITS = 8;
const MARGIN = 8;

export function hexDigitAt(position) {
  return hexDigitsAt(position, 1);
}

export function hexDigitsAt(position, count) {
  assertPosition(position);
  assertCount(count);

  const shift = BigInt(position - 1);

  // The head contributes at most one unit of loss per term across four sums of
  // total weight eight, so working to the width of the position in hexadecimal
  // plus the margin keeps the loss far below the last digit returned.
  const working = count + MARGIN + position.toString(16).length;
  const scale = 16n ** BigInt(working);

  let total = 0n;
  for (const { offset, weight } of TERMS) {
    total += weight * seriesSum(offset, shift, scale);
  }

  const fraction = ((total % scale) + scale) % scale;

  return fraction.toString(16).padStart(working, "0").slice(0, count);
}

function seriesSum(offset, shift, scale) {
  let sum = 0n;

  // Head, for k up to the shift. Reducing 16^(shift - k) modulo the
  // denominator first is what keeps every operand small; without it the
  // numerator would be as large as pi's whole prefix.
  for (let k = 0n; k <= shift; k += 1n) {
    const denominator = 8n * k + offset;
    const numerator = modPow(16n, shift - k, denominator);
    sum = (sum + (numerator * scale) / denominator) % scale;
  }

  // Tail, for k beyond the shift. Terms shrink by a factor of sixteen each
  // step and stop contributing once the division underflows the fixed point.
  let power = scale;
  for (let k = shift + 1n; ; k += 1n) {
    power /= 16n;
    if (power === 0n) {
      break;
    }

    sum += power / (8n * k + offset);
  }

  return sum;
}

function modPow(base, exponent, modulus) {
  if (modulus === 1n) {
    return 0n;
  }

  let result = 1n;
  let factor = base % modulus;
  let remaining = exponent;

  while (remaining > 0n) {
    if (remaining % 2n === 1n) {
      result = (result * factor) % modulus;
    }

    factor = (factor * factor) % modulus;
    remaining >>= 1n;
  }

  return result;
}

function assertPosition(position) {
  if (typeof position !== "number" || !Number.isInteger(position)) {
    throw new TypeError("position must be an integer");
  }

  if (position < 1) {
    throw new RangeError("position counts from one");
  }
}

function assertCount(count) {
  if (typeof count !== "number" || !Number.isInteger(count)) {
    throw new TypeError("count must be an integer");
  }

  if (count < 1 || count > MAX_DIGITS) {
    throw new RangeError(`count must be between 1 and ${MAX_DIGITS}`);
  }
}
