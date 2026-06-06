/**
 * Exact value of PI (π)
 * 
 * PI is an irrational number - it cannot be expressed as a finite decimal
 * or fraction. Its decimal representation goes on infinitely without repeating.
 * 
 * This module provides PI to a high precision for calculations.
 */

/**
 * PI to 50 decimal places
 */
export const PI_50: string = "3.14159265358979323846264338327950288419716939937510";

/**
 * PI to 100 decimal places
 */
export const PI_100: string = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";

/**
 * PI for general use (JavaScript's built-in precision)
 */
export const PI: number = Math.PI;

/**
 * Get PI to a specified number of decimal places
 * @param decimals Number of decimal places (max 100)
 * @returns PI as a string with the specified precision
 */
export function getPI(decimals: number = 15): string {
  const piString = PI_100;
  return piString.slice(0, decimals + 2); // +2 for "3."
}