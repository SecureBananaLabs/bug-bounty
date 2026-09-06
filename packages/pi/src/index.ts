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
  if (digits < 1) throw new Error("digits must be >= 1");

  // Guard digits (extra precision for rounding)
  const guard = 14;
  const totalDigits = digits + guard;

  // Working scale: 10^(digits + guard)
  const S = 10n ** BigInt(totalDigits);

  // --- Pre-compute sqrt(10005) * S using Newton's method ---
  // C = 426880 * sqrt(10005) * S
  const sqrt10005S = bigIntSqrt(10005n * S * S);
  const C = 426880n * sqrt10005S;

  // --- Chudnovsky series: π = C / Σ_{k=0}^{∞} term_k ---
  // term_k = (6k)! * (13591409 + 545140134k) / ((3k)! * (k!)^3 * (-262537412640768000)^k)
  // term_0 = 13591409 / 1

  let sumNum = 13591409n; // term_0 numerator (no S factor - S is in C)
  let sumDen = 1n;

  let fact6_k = 1n;  // (6k)! for current k
  let fact3_k = 1n;  // (3k)! for current k
  let fact1_k = 1n;  // k! for current k
  let powD_k = 1n;   // D^k for current k, where D = -262537412640768000n

  const D = 262537412640768000n; // positive, we track sign separately

  for (let k = 1; k <= 100000; k++) {
    // Update factorials incrementally from k-1 to k
    const k6 = BigInt(6 * k);
    const k3 = BigInt(3 * k);
    const k1 = BigInt(k);

    // (6k)! = (6k-5)(6k-4)(6k-3)(6k-2)(6k-1)(6k) * (6(k-1))!
    fact6_k = fact6_k * (k6 - 5n) * (k6 - 4n) * (k6 - 3n) * (k6 - 2n) * (k6 - 1n) * k6;
    // (3k)! = (3k-2)(3k-1)(3k) * (3(k-1))!
    fact3_k = fact3_k * (k3 - 2n) * (k3 - 1n) * k3;
    // k! = k * (k-1)!
    fact1_k = fact1_k * k1;
    // D^k = D * D^(k-1)
    powD_k = powD_k * D;

    // term numerator = (6k)! * (13591409 + 545140134k)
    const termNum = fact6_k * (13591409n + 545140134n * k1);

    // term denominator = (3k)! * (k!)^3 * D^k
    const termDen = fact3_k * fact1_k * fact1_k * fact1_k * powD_k;

    // sign alternates: D^k has sign (-1)^k
    const termNeg = (k % 2 === 1);

    // Check convergence: |term_k| < 10^(-digits-guard), meaning it doesn't affect result
    // |term_k| = termNum / termDen
    // If termNum * 10^(digits+guard) / termDen < 1, we can stop
    const precisionCheck = S; // 10^(digits + guardDigits)
    const termAbsScaled = termNum * precisionCheck / (termDen < 0n ? -termDen : termDen);
    if (termAbsScaled < 1n) {
      break;
    }

    // sum += term  (with sign)
    // sumNum/sumDen + termNum/termDen (accounting for sign)
    // = (sumNum * termDen + termNum * sumDen * sign) / (sumDen * termDen)
    // where sign = -1 if termNeg else +1

    const newNum = sumNum * termDen + (termNeg ? -termNum : termNum) * sumDen;
    const newDen = sumDen * termDen;

    sumNum = newNum >= 0n ? newNum : -newNum;
    sumDen = newDen;

    // Periodically reduce fraction to keep numbers manageable
    if (k % 10 === 0) {
      const g = gcd(sumNum, sumDen);
      if (g > 1n) {
        sumNum /= g;
        sumDen /= g;
      }
    }
  }

  // PI = C / (sumNum/sumDen)  [sum is positive since π > 0]
  // But our sum tracks sign separately
  // piScaled = C * sumDen / sumNum  (scaled by S)
  const piScaled = C * sumDen / sumNum;

  // Convert to string: piScaled = floor(π * 10^(digits+guard))
  const piStr = piScaled.toString();

  // Extract integer and fractional parts
  let intPart: string;
  let fracPart: string;

  if (piStr.length <= totalDigits) {
    intPart = piStr.slice(0, 1);
    fracPart = piStr.length > 1 ? piStr.slice(1).padStart(totalDigits, "0") : "0".repeat(totalDigits);
  } else {
    intPart = piStr.slice(0, piStr.length - totalDigits);
    fracPart = piStr.slice(piStr.length - totalDigits);
  }

  // Round using guard digits
  const roundDigit = Number(fracPart[digits]);
  let roundedFrac = fracPart.slice(0, digits);

  if (roundDigit >= 5) {
    const roundedNum = BigInt(roundedFrac || "0") + 1n;
    roundedFrac = roundedNum.toString().padStart(digits, "0");
    if (roundedFrac.length > digits) {
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
try {
  const isDirectRun =
    typeof process !== "undefined" &&
    typeof process.argv !== "undefined" &&
    typeof import.meta !== "undefined" &&
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
