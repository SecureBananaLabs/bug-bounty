/**
 * Defensively parses URL query strings into structured objects.
 * Features prototype pollution defense, safe percent-decoding,
 * array param accumulation, and configurable type casting.
 *
 * @param {string} queryString - The raw query string to parse
 * @param {Object} [options={}] - Parsing options
 * @param {boolean} [options.parseBooleans=true] - Cast 'true'/'false' to boolean
 * @param {boolean} [options.parseNumbers=true] - Cast numeric strings to numbers
 * @param {boolean} [options.prototypeProtection=true] - Block prototype pollution keys
 * @returns {Record<string, any>} Parsed query object
 */
export function parseQueryString(queryString, options = {}) {
  const {
    parseBooleans = true,
    parseNumbers = true,
    prototypeProtection = true
  } = options;

  if (typeof queryString !== 'string') {
    return {};
  }

  const cleaned = queryString.trim().replace(/^[?#]/, '');
  if (!cleaned) {
    return {};
  }

  const result = {};

  const isForbiddenKey = (key) => {
    const normalized = key.toLowerCase();
    return (
      normalized === '__proto__' ||
      normalized === 'constructor' ||
      normalized === 'prototype' ||
      normalized.startsWith('__proto__') ||
      normalized.startsWith('constructor') ||
      normalized.startsWith('prototype')
    );
  };

  const pairs = cleaned.split(/[&;]/);
  for (const pair of pairs) {
    if (!pair) continue;

    const eqIdx = pair.indexOf('=');
    let rawKey = '';
    let rawVal = '';

    if (eqIdx === -1) {
      rawKey = pair;
      rawVal = parseBooleans ? 'true' : '';
    } else {
      rawKey = pair.slice(0, eqIdx);
      rawVal = pair.slice(eqIdx + 1);
    }

    let key = '';
    try {
      key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    } catch {
      key = rawKey;
    }

    if (prototypeProtection && isForbiddenKey(key)) {
      continue;
    }

    let val = '';
    try {
      val = decodeURIComponent(rawVal.replace(/\+/g, ' '));
    } catch {
      val = rawVal;
    }

    let parsedVal = val;
    if (parseBooleans && (val === 'true' || val === 'false')) {
      parsedVal = val === 'true';
    } else if (parseNumbers && val.trim() !== '' && !isNaN(Number(val)) && Number.isFinite(Number(val))) {
      parsedVal = Number(val);
    }

    if (Object.prototype.hasOwnProperty.call(result, key)) {
      if (Array.isArray(result[key])) {
        result[key].push(parsedVal);
      } else {
        result[key] = [result[key], parsedVal];
      }
    } else {
      result[key] = parsedVal;
    }
  }

  return result;
}
