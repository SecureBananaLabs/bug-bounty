export function isqrt(value) {
  if (typeof value !== "bigint") {
    throw new TypeError("isqrt requires a BigInt");
  }

  if (value < 0n) {
    throw new RangeError("isqrt is undefined for negative input");
  }

  if (value < 2n) {
    return value;
  }

  return rooted(value, value.toString(2).length);
}

// Below this width the bit-length seed is already close enough that the extra
// recursion costs more than the iterations it saves.
const DIRECT_BITS = 104;

// Newton's method converges quadratically, but only once the estimate is near
// the root, and every iteration costs a division at the full operand width. So
// the seed comes from the root of the operand with its lower half shifted away:
// that value is half as wide and its own root, shifted back up, already agrees
// with the answer to about half the required bits. One or two iterations then
// finish the job at each width. The work forms a geometric series dominated by
// the top level, rather than a fixed count of full-width iterations.
function rooted(value, bits) {
  if (bits <= DIRECT_BITS) {
    // 2^ceil(bits/2) is never below the true root and never more than a factor
    // of two above it.
    return refine(value, 1n << BigInt((bits + 1) >> 1));
  }

  // Shift by an even count so the halving is exact in the root.
  const shift = 2 * (bits >> 2);
  const seed = rooted(value >> BigInt(shift), bits - shift) << BigInt(shift >> 1);

  return refine(value, seed);
}

function refine(value, seed) {
  // One step from any positive seed lands on or above the floor of the root.
  // From above the sequence decreases monotonically until it reaches that
  // floor, so the first non-decreasing step is the answer.
  let estimate = (seed + value / seed) >> 1n;

  for (;;) {
    const next = (estimate + value / estimate) >> 1n;
    if (next >= estimate) {
      return estimate;
    }

    estimate = next;
  }
}
