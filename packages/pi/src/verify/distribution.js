// Pi is conjectured to be normal in base ten, so a long run of its digits
// should sit close to a uniform distribution. This is a smoke test and not a
// correctness proof: passing it says nothing about whether the digits are
// pi's. Its value is the other direction, since a fabricated, repeating or
// truncation-damaged sequence fails it immediately.

const BASE = 10;
const DEGREES_OF_FREEDOM = BASE - 1;

// Upper 0.1 per cent point of the chi-squared distribution on nine degrees of
// freedom. A loose bound on purpose, so that ordinary sampling noise in a
// correct sequence cannot fail the check.
export const CHI_SQUARED_CRITICAL = 27.877;

export function digitDistribution(value) {
  if (typeof value !== "string") {
    throw new TypeError("digitDistribution requires a string");
  }

  const counts = new Array(BASE).fill(0);
  let total = 0;

  for (const character of value) {
    if (character === ".") {
      continue;
    }

    const digit = character.charCodeAt(0) - 48;
    if (digit < 0 || digit >= BASE) {
      throw new RangeError(`unexpected character in digit string: ${character}`);
    }

    counts[digit] += 1;
    total += 1;
  }

  if (total === 0) {
    throw new RangeError("digitDistribution requires at least one digit");
  }

  const expected = total / BASE;
  let chiSquared = 0;
  for (const count of counts) {
    const deviation = count - expected;
    chiSquared += (deviation * deviation) / expected;
  }

  return {
    total,
    counts,
    expected,
    chiSquared,
    degreesOfFreedom: DEGREES_OF_FREEDOM
  };
}
