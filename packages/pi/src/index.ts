#!/usr/bin/env node

/**
 * High-precision PI calculation using the Chudnovsky algorithm.
 *
 * References:
 *   Chudnovsky brothers (1989) — https://en.wikipedia.org/wiki/Chudnovsky_algorithm
 *   Each term adds ~14.18 digits of precision.
 *
 * Usage:
 *   npx tsx src/index.ts <digits>   # prints PI to <digits> decimal places
 *   Default: 1000 digits
 */

/**
 * Compute PI to the given number of decimal digits using the Chudnovsky
 * algorithm with BigInt arithmetic.
 *
 * @param digits  Number of decimal places (default 1000)
 * @returns       PI as a string with exactly `digits` decimal places
 */
export function computePi(digits: number = 1000): string {
  if (digits < 1) {
    throw new Error("digits must be >= 1");
  }

  // --- Constants for the Chudnovsky algorithm -------------------------
  // PI = C / (SUM), where C = 426880 * sqrt(10005)
  // SUM = SUM_{k=0}^{∞} ( (6k)! * (13591409 + 545140134*k) ) / ( (3k)! * (k!)^3 * (-262537412640768000)^k )
  //
  // We work with scaled integers:
  //   scale = 10^(digits + guard_digits)
  //   C = floor(426880 * sqrt(10005) * scale)
  //   SUM = 0 (scaled), accumulate terms until the term < 1

  const guardDigits = 14; // extra digits to avoid rounding errors (~1 term worth)
  const scale = BigInt(10) ** BigInt(digits + guardDigits);

  // sqrt(10005) computed via Newton's method on BigInts
  const sqrt10005 = bigIntSqrt(10005n * scale);
  const C = (426880n * sqrt10005) / bigIntSqrt(scale); // scale down earlier
  // Actually, let's compute C = floor(426880 * sqrt(10005) * scale)
  const C_full = 426880n * bigIntSqrt(10005n * scale * scale); // sqrt(10005) * scale

  // --- Accumulate the series ------------------------------------------
  // term_k = (6k)! * (13591409 + 545140134*k) / ( (3k)! * (k!)^3 * (-262537412640768000)^k )
  // We keep term_k as a rational: numerator / denominator, both BigInts.

  let sumNumerator = 13591409n * scale; // k=0 term numerator (scaled)
  let sumDenominator = 1n;

  // Precompute factorials iteratively to avoid massive recomputation
  let fact6k = 1n;    // (6k)!
  let fact3k = 1n;    // (3k)!
  let factK = 1n;     // k!

  const D = -262537412640768000n; // the constant denominator factor

  let powerD = 1n; // D^k

  for (let k = 1; k < 100_000; k++) {
    // Update factorials for this k
    // (6k)! = (6k-5)*(6k-4)*(6k-3)*(6k-2)*(6k-1)*(6k) * (6(k-1))!
    const kBig = BigInt(k);
    const kMinus1 = BigInt(k - 1);

    // Compute (6k)! incrementally
    for (let j = 6 * (k - 1) + 1; j <= 6 * k; j++) {
      fact6k *= BigInt(j);
    }
    // Compute (3k)! incrementally
    for (let j = 3 * (k - 1) + 1; j <= 3 * k; j++) {
      fact3k *= BigInt(j);
    }
    // Compute k! incrementally
    factK *= kBig;

    // D^k
    powerD *= D;

    // numerator_k = (6k)! * (13591409 + 545140134*k)
    const termNum = fact6k * (13591409n + 545140134n * kBig);

    // denominator_k = (3k)! * (k!)^3 * D^k
    const termDen = fact3k * factK * factK * factK * powerD;

    // term_k = termNum / termDen  (rational)
    // Add to sum: sumNumerator/sumDenominator + termNum/termDen
    // = (sumNumerator * termDen + termNum * sumDenominator) / (sumDenominator * termDen)

    // To avoid huge intermediate numbers, we check if the term is negligible
    // |term_k| ≈ 1 / (262537412640768000)^k  → converges fast
    // Early exit when term < 1 (i.e., |termNum * scale| < |termDen|)

    // Scale the term: term_scaled = termNum * scale / termDen
    // If |term_scaled| < 1, it won't affect the first `digits` decimal places
    const termAbsScaled = termNum * scale / (termDen < 0n ? -termDen : termDen);
    if (termAbsScaled < 1n) {
      break;
    }

    // Add term to sum: sum += term
    sumNumerator = sumNumerator * termDen + termNum * sumDenominator;
    sumDenominator = sumDenominator * termDen;

    // Reduce fraction periodically to keep numbers manageable
    if (k % 10 === 0) {
      const g = gcd(sumNumerator, sumDenominator);
      if (g > 1n) {
        sumNumerator /= g;
        sumDenominator /= g;
      }
    }
  }

  // PI = C_full / (sumNumerator / sumDenominator)
  // PI_scaled = C_full * sumDenominator / sumNumerator
  const piScaled = (C_full * sumDenominator) / sumNumerator;

  // --- Convert to decimal string ------------------------------------
  const piStr = piScaled.toString();

  // The number of digits we have: piScaled = floor(PI * 10^(digits+guardDigits))
  // So PI = piScaled / 10^(digits+guardDigits)
  // Insert decimal point at position (digits + guardDigits) from right
  const totalDecimalDigits = digits + guardDigits;
  let intPart: string;
  let fracPart: string;

  if (piStr.length <= totalDecimalDigits) {
    // Need leading zeros
    intPart = "3"; // PI is ~3.14..., should not happen in practice
    fracPart = piStr.padStart(totalDecimalDigits, "0");
  } else {
    intPart = piStr.slice(0, piStr.length - totalDecimalDigits);
    fracPart = piStr.slice(piStr.length - totalDecimalDigits);
  }

  // Round to `digits` decimal places using the guard digits
  const roundDigit = Number(fracPart[digits]);
  let roundedFrac = fracPart.slice(0, digits);

  if (roundDigit >= 5) {
    // Round up
    const roundedNum = BigInt(roundedFrac || "0") + 1n;
    roundedFrac = roundedNum.toString().padStart(digits, "0");
    if (roundedFrac.length > digits) {
      // Carry to integer part
      intPart = (BigInt(intPart) + 1n).toString();
      roundedFrac = roundedFrac.slice(1);
    }
  }

  return `${intPart}.${roundedFrac}`;
}

/**
 * Compute floor(sqrt(n)) for a BigInt using Newton's method.
 */
function bigIntSqrt(n: bigint): bigint {
  if (n < 0n) throw new Error("Cannot compute sqrt of negative number");
  if (n < 2n) return n;

  // Initial estimate: 2^(bitLength/2)
  let x = 1n << BigInt((n.toString(2).length + 1) >> 1);

  while (true) {
    const y = (x + n / x) >> 1n;
    if (y >= x) return x;
    x = y;
  }
}

/**
 * Greatest common divisor (Euclidean algorithm) for BigInt.
 */
function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b > 0n) {
    [a, b] = [b, a % b];
  }
  return a;
}

// ── CLI entry point ───────────────────────────────────────────────
// When run directly via `node dist/index.js` or `npx tsx src/index.ts`
try {
  // @ts-ignore - process.argv is Node.js specific
  const isDirectRun =
    typeof process !== "undefined" &&
    typeof process.argv !== "undefined" &&
    process.argv.length >= 2 &&
    // @ts-ignore
    import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));

  if (isDirectRun) {
    const digitsArg = process.argv[2] ? parseInt(process.argv[2], 10) : 1000;
    if (isNaN(digitsArg) || digitsArg < 1) {
      console.error("Usage: node dist/index.js <digits (positive integer)>");
      process.exit(1);
    }

    const pi = computePi(digitsArg);
    console.log(pi);
  }
} catch {
  // Not in a Node.js environment, skip CLI
}
