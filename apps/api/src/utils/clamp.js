/**
 * @file clamp.js
 * High-performance numeric boundary clamping and range checking utilities.
 */

'use strict';

/**
 * Clamps a number within the inclusive lower and upper bounds.
 *
 * @param {number} value The number to clamp
 * @param {number} min The lower bound
 * @param {number} max The upper bound
 * @returns {number} Clamped number
 */
export function clamp(value, min, max) {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new TypeError('First argument value must be a finite number');
  }
  if (typeof min !== 'number' || Number.isNaN(min) || !Number.isFinite(min)) {
    throw new TypeError('Second argument min must be a finite number');
  }
  if (typeof max !== 'number' || Number.isNaN(max) || !Number.isFinite(max)) {
    throw new TypeError('Third argument max must be a finite number');
  }

  const lower = Math.min(min, max);
  const upper = Math.max(min, max);

  return Math.min(Math.max(value, lower), upper);
}

/**
 * Checks if a number is within the inclusive bounds [min, max].
 *
 * @param {number} value The number to check
 * @param {number} min Lower bound
 * @param {number} max Upper bound
 * @returns {boolean} True if value is within bounds
 */
export function inRange(value, min, max) {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new TypeError('First argument value must be a finite number');
  }
  if (typeof min !== 'number' || Number.isNaN(min) || !Number.isFinite(min)) {
    throw new TypeError('Second argument min must be a finite number');
  }
  if (typeof max !== 'number' || Number.isNaN(max) || !Number.isFinite(max)) {
    throw new TypeError('Third argument max must be a finite number');
  }

  const lower = Math.min(min, max);
  const upper = Math.max(min, max);

  return value >= lower && value <= upper;
}