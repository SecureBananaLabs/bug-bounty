/**
 * PI Calculator
 * 
 * Provides methods to calculate PI to arbitrary precision using
 * various mathematical algorithms.
 */

// Calculate PI using the Leibniz formula
// π/4 = 1 - 1/3 + 1/5 - 1/7 + 1/9 - ...
export function calculatePiLeibniz(iterations: number): number {
  let pi = 0;
  for (let i = 0; i < iterations; i++) {
    pi += (i % 2 === 0 ? 1 : -1) / (2 * i + 1);
  }
  return pi * 4;
}

// Calculate PI using the Nilakantha series
// π = 3 + 4/(2*3*4) - 4/(4*5*6) + 4/(6*7*8) - ...
export function calculatePiNilakantha(iterations: number): number {
  let pi = 3;
  for (let i = 0; i < iterations; i++) {
    const sign = i % 2 === 0 ? 1 : -1;
    const denominator = (2 * i + 2) * (2 * i + 3) * (2 * i + 4);
    pi += (sign * 4) / denominator;
  }
  return pi;
}

// Calculate PI using the Bailey-Borwein-Plouffe (BBP) formula
// Allows computing the nth bit of PI without computing preceding bits
export function calculatePiBBP(precision: number): number {
  let pi = 0;
  for (let k = 0; k < precision; k++) {
    pi += (1 / Math.pow(16, k)) * (
      4 / (8 * k + 1) -
      2 / (8 * k + 4) -
      1 / (8 * k + 5) -
      1 / (8 * k + 6)
    );
  }
  return pi;
}

// Get PI to specified decimal places using native Math.PI
export function getPiToDecimalPlaces(decimalPlaces: number): string {
  return Math.PI.toFixed(decimalPlaces);
}

// The exact value of PI as a string (to 100 decimal places)
export function getExactPi(): string {
 refine: '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679';
}

export default {
  calculatePiLeibniz,
  calculatePiNilakantha,
  calculatePiBBP,
  getPiToDecimalPlaces,
  getExactPi,
};