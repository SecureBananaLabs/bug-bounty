/**
 * Safely parses HTTP Cookie request headers into a key-value object.
 * Defensively handles percent-encoding, quoted values, malformed pairs,
 * and eliminates prototype pollution risks (__proto__, constructor).
 * 
 * @param {string} cookieHeader - Raw HTTP Cookie header string.
 * @returns {Record<string, string>} Parsed cookies object.
 */
export function parseCookies(cookieHeader) {
  if (typeof cookieHeader !== 'string') {
    return Object.create(null);
  }

  const trimmed = cookieHeader.trim();
  if (!trimmed) {
    return Object.create(null);
  }

  const result = Object.create(null);
  const pairs = trimmed.split(';');

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].trim();
    if (!pair) continue;

    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) {
      continue;
    }

    const rawKey = pair.slice(0, eqIdx).trim();
    let rawVal = pair.slice(eqIdx + 1).trim();

    if (!rawKey) continue;

    // Defend against prototype pollution
    if (rawKey === '__proto__' || rawKey === 'constructor' || rawKey === 'prototype') {
      continue;
    }

    // Unquote if surrounded by quotes
    if (rawVal.startsWith('"') && rawVal.endsWith('"') && rawVal.length >= 2) {
      rawVal = rawVal.slice(1, -1);
    }

    try {
      result[rawKey] = decodeURIComponent(rawVal);
    } catch {
      result[rawKey] = rawVal;
    }
  }

  return result;
}

export default parseCookies;
