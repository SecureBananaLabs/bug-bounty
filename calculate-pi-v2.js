// Calculate PI to N decimal places using Machin's formula with BigInt.
// PI = 16 * arctan(1/5) - 4 * arctan(1/239)
// where arctan(1/x) = sum_{k=0}^{inf} (-1)^k / ((2k+1) * x^(2k+1))

const fs = require("fs");
const path = require("path");

/**
 * Integer square root using Newton's method with BigInt.
 */
function isqrt(n) {
  if (n < 0n) throw new Error("Cannot take square root of negative number");
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

/**
 * Compute arctan(1/x) * 10^precision using Taylor series.
 * arctan(1/x) = 1/x - 1/(3*x^3) + 1/(5*x^5) - ...
 * @param {bigint} x - The denominator.
 * @param {bigint} precision - Number of decimal places as BigInt power of 10.
 * @returns {bigint} arctan(1/x) * 10^precision
 */
function arctanInv(x, precision) {
  const SCALE = 10n ** precision;
  const x2 = x * x;
  
  let term = SCALE / x;  // First term: 1/x * SCALE
  let sum = term;
  let k = 1n;
  
  while (term !== 0n) {
    // Next term: previous_term / x^2, with alternating sign
    term = term / x2;
    if (k % 2n === 1n) {
      sum -= term / (2n * k + 1n);
    } else {
      sum += term / (2n * k + 1n);
    }
    k++;
  }
  
  return sum;
}

/**
 * Calculate PI to `digits` decimal places using Machin's formula.
 * PI = 16 * arctan(1/5) - 4 * arctan(1/239)
 * @param {number} digits - Number of decimal digits to compute.
 * @returns {string} PI as a string "3.14159..."
 */
function calculatePI(digits) {
  const GUARD = 10;
  const PREC = BigInt(digits + GUARD);
  
  // PI * 10^PREC = 16 * arctan(1/5) - 4 * arctan(1/239)
  const arctan5 = arctanInv(5n, PREC);
  const arctan239 = arctanInv(239n, PREC);
  
  const piScaled = 16n * arctan5 - 4n * arctan239;
  
  // Convert to string
  let piStr = piScaled.toString();
  // piStr is PI * 10^PREC, so it starts with "3" followed by PREC digits
  const intPart = piStr[0];
  const decPart = piStr.slice(1, digits + 1);
  return intPart + "." + decPart;
}

// Calculate PI to 10,000 decimal places
const DIGITS = 10000;
console.log(`Calculating PI to ${DIGITS} decimal places...`);
const startTime = Date.now();
const pi = calculatePI(DIGITS);
const elapsed = Date.now() - startTime;
console.log(`Calculated in ${elapsed}ms`);

const outDir = path.join(__dirname, "pi");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "pi.txt");
fs.writeFileSync(outFile, pi + "\n");
console.log(`Written to ${outFile} (${pi.length} chars)`);

// Verification
const knownPI = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";
const computed100 = pi.slice(0, knownPI.length);
const matches = computed100 === knownPI;
const verifyFile = path.join(outDir, "pi-verification.txt");
fs.writeFileSync(verifyFile, `Known (100 digits): ${knownPI}\nComputed (100 digits): ${computed100}\nMatch: ${matches}\n\nFull computation: ${DIGITS} digits\nTime: ${elapsed}ms\n`);
console.log(`Verification: ${matches ? "PASS" : "FAIL"} (first 100 digits match)`);
if (!matches) {
  console.log(`Expected: ${knownPI.slice(0, 60)}...`);
  console.log(`Got:      ${computed100.slice(0, 60)}...`);
}
