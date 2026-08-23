/**
 * @file roundTo.js
 * High-precision decimal rounding utility eliminating IEEE 754 floating point anomalies with multiple rounding modes.
 */

'use strict';

/**
 * Rounds a number to a specified number of decimal places using various rounding modes.
 *
 * @param {number} value The number to round
 * @param {number} [decimals=0] Number of decimal places
 * @param {'half-up'|'half-even'|'ceil'|'floor'|'trunc'} [mode='half-up'] Rounding mode
 * @returns {number} Rounded result
 */
export function roundTo(value, decimals = 0, mode = 'half-up') {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new TypeError('First argument value must be a finite number');
  }

  if (typeof decimals !== 'number' || Number.isNaN(decimals) || !Number.isInteger(decimals) || decimals < 0) {
    throw new TypeError('Second argument decimals must be a non-negative integer');
  }

  if (decimals === 0 && mode === 'half-up') {
    return Math.round(value);
  }

  const factor = Math.pow(10, decimals);

  switch (mode) {
    case 'ceil': {
      return Number(Math.ceil(Number(value + 'e' + decimals)) + 'e-' + decimals);
    }
    case 'floor': {
      return Number(Math.floor(Number(value + 'e' + decimals)) + 'e-' + decimals);
    }
    case 'trunc': {
      return Number(Math.trunc(Number(value + 'e' + decimals)) + 'e-' + decimals);
    }
    case 'half-even':
    case 'bankers': {
      const shifted = Number(value + 'e' + decimals);
      const floor = Math.floor(shifted);
      const diff = shifted - floor;
      if (Math.abs(diff - 0.5) < 1e-12) {
        return Number((floor % 2 === 0 ? floor : floor + 1) + 'e-' + decimals);
      }
      return Number(Math.round(shifted) + 'e-' + decimals);
    }
    case 'half-up':
    default: {
      return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
    }
  }
}