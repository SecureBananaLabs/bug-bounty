/**
 * Safely parses human-readable duration strings into milliseconds.
 * Supported units: ms (milliseconds), s (seconds), m (minutes), h (hours), d (days), w (weeks), y (years).
 * 
 * @param {string|number} duration - Input duration string (e.g., '15m', '2h', '500ms') or numeric milliseconds.
 * @returns {number|null} Duration in milliseconds or null if invalid.
 */
const UNIT_FACTORS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  y: 365.25 * 24 * 60 * 60 * 1000
};

const DURATION_REGEX = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(ms|s|m|h|d|w|y)?$/i;

export function parseDuration(duration) {
  if (typeof duration === 'number') {
    return Number.isFinite(duration) && duration >= 0 ? Math.round(duration) : null;
  }
  if (typeof duration !== 'string') {
    return null;
  }

  const trimmed = duration.trim();
  if (!trimmed) {
    return null;
  }

  const match = DURATION_REGEX.exec(trimmed);
  if (!match) {
    return null;
  }

  const val = parseFloat(match[1]);
  if (!Number.isFinite(val) || val < 0) {
    return null;
  }

  const unit = (match[2] || 'ms').toLowerCase();
  const factor = UNIT_FACTORS[unit];
  if (!factor) {
    return null;
  }

  return Math.round(val * factor);
}

export default parseDuration;
