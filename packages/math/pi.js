/**
 * PI Constant and Utilities
 * Issue #2872 - Calculate the exact value of PI
 * 
 * Note: PI is an irrational, transcendental number.
 * Its decimal representation is infinite and non-repeating.
 * The "exact" value cannot be computed to all decimal places.
 */

// JavaScript's built-in PI constant (IEEE 754 double precision)
export const PI = Math.PI; // 3.141592653589793

// For display purposes - known digits of PI
export const PI_KNOWN_DIGITS = "3.14159265358979323846264338327950288419716939937510";

// Helper to get PI to a specific number of decimal places
export function getPI(decimalPlaces = 15) {
  return parseFloat(PI.toFixed(decimalPlaces));
}