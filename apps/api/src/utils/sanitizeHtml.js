/**
 * Defensive HTML sanitizer to neutralize XSS vectors
 */
function sanitizeHtml(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // 1. Strip dangerous tags
  let sanitized = input.replace(/<\s*(script|iframe|object|embed|style|link|meta)[^>]*>.*?<\s*\/\s*\1\s*>/gis, '');
  sanitized = sanitized.replace(/<\s*(script|iframe|object|embed|style|link|meta)[^>]*>/gis, '');

  // 2. Disarm inline event handlers (e.g. onerror=, onclick=)
  sanitized = sanitized.replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gis, '');

  // 3. Disarm javascript: pseudo-protocol in attributes
  sanitized = sanitized.replace(/(href|src)\s*=\s*["']?\s*javascript:[^"'>\s]*/gis, '$1="#"');

  // 4. Encode remaining dangerous markup characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return sanitized;
}

export { sanitizeHtml };
