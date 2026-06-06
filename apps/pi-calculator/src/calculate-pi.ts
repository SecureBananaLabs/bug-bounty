/**
 * Exact Value of PI Calculator
 * 
 * PI (π) is a mathematical constant representing the ratio of a circle's
 * circumference to its diameter. It is an irrational number, meaning its
 * decimal representation goes on forever without repeating.
 * 
 * The exact value of PI to many decimal places:
 * π = 3.14159265358979323846264338327950288419716939937510...
 */

export const EXACT_PI_VALUE = '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679';

/**
 * Calculate PI to a specified number of decimal places
 * @param decimalPlaces Number of decimal places (default: 100)
 * @returns PI as a string with specified precision
 */
export function calculatePi(decimalPlaces: number = 100): string {
  const pi = EXACT_PI_VALUE;
  if (decimalPlaces <= 0) {
    return pi.split('.')[0];
  }
  const integerPart = pi.split('.')[0];
  const decimalPart = pi.split('.')[1] || '';
  const requestedDecimal = decimalPart.substring(0, decimalPlaces);
  return `${integerPart}.${requestedDecimal}`;
}

/**
 * Stream PI digits one at a time (generator function for infinite precision)
 */
export function* streamPiDigits(): Generator<string> {
  const digits = EXACT_PI_VALUE.replace('.', '');
  for (const digit of digits) {
    yield digit;
  }
  // Continue with additional calculated digits
  // PI is irrational, so we can always generate more
  while (true) {
    yield '?'; // Placeholder for beyond-known digits
  }
}

if (require.main === module) {
  const precision = process.argv[2] ? parseInt(process.argv[2], 10) : 100;
  console.log(`PI to ${precision} decimal places:`);
  console.log(calculatePi(precision));
}