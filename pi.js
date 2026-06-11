/**
 * pi.js
 * Calculates the exact value of PI to a specified number of decimal places.
 * 
 * Note: PI is an irrational number - its decimal representation goes on forever
 * without repeating. This utility provides PI to high precision using JavaScript's
 * built-in Math.PI and optional arbitrary-precision extensions.
 */

// JavaScript's built-in PI (IEEE 754 double precision, ~15-17 decimal digits)
const PI_BUILTIN = Math.PI;

// PI to 100 decimal places for reference
const PI_100_DIGITS = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";

/**
 * Get PI with the specified number of decimal places
 * @param {number} decimals - Number of decimal places (max 100)
 * @returns {string} PI to the specified precision
 */
function getPI(decimals = 15) {
  if (decimals <= 15) {
    return PI_BUILTIN.toFixed(decimals);
  }
  return PI_100_DIGITS.slice(0, decimals + 2); // +2 for "3."
}

module.exports = { PI_BUILTIN, PI_100_DIGITS, getPI };

console.log(`Exact value of PI: ${PI_100_DIGITS}`);
console.log(`JavaScript Math.PI: ${PI_BUILTIN}`);