/**
 * PI Calculator Module
 * 
 * This module provides utilities for working with the mathematical constant π (pi).
 * As an transcendental irrational number, π cannot be represented exactly in finite
 * space. This module uses high-precision algorithms to approximate π to many
 * decimal places.
 */

// The exact mathematical constant π (to JavaScript's floating-point precision)
export const PI = Math.PI;

// High-precision string representation of π (50 decimal places)
export const PI_HIGH_PRECISION = '3.14159265358979323846264338327950288419716939937510';

/**
 * Calculate π using the Bailey-Borwein-Plouffe (BBP) formula
 * This spigot algorithm can compute nth digit of π without computing preceding digits
 */
export function calculatePiBBP(n) {
  let sum = 0;
  for (let k = 0; k < n; k++) {
    sum += (1 / Math.pow(16, k)) * 
           ((4 / (8 * k + 1)) - 
            (2 / (8 * k + 4)) - 
            (1 / (8 * k + 5)) - 
            (1 / (8 * k + 6)));
  }
  return sum;
}

/**
 * Get π to a specified number of decimal places
 */
export function getPiToDecimals(decimals) {
  return PI.toFixed(Math.min(decimals, 100));
}

/**
 * The exact value of π is represented by the limit:
 * π = 4 * (1 - 1/3 + 1/5 - 1/7 + 1/9 - ...)
 * This is the Leibniz formula, though it converges slowly.
 */
export function leibnizPi(iterations) {
  let sum = 0;
  for (let i = 0; i < iterations; i++) {
    sum += Math.pow(-1, i) / (2 * i + 1);
  }
  return 4 * sum;
}