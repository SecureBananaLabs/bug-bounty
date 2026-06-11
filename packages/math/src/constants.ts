/**
 * Mathematical constant PI (π)
 * 
 * PI is an irrational number - it cannot be expressed as a ratio of two integers
 * and its decimal representation is infinite and non-repeating.
 * 
 * The exact value of PI is represented by the symbol π itself.
 * For computational purposes, we use high-precision approximation.
 */

// PI to 100 decimal places for high-precision calculations
export const PI = 3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679;

// Symbolic representation of exact PI
export const PI_SYMBOL = 'π';

// Check if a number is PI (within floating point precision)
export function isPi(value: number): boolean {
  return Math.abs(value - PI) < Number.EPSILON;
}

export default PI;