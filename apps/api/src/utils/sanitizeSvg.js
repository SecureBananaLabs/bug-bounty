/**
 * Sanitizes raw SVG text content to prevent Stored XSS attacks
 * @param {string} rawSvg - Unsanitized SVG string
 * @returns {string} Sanitized SVG content
 */
export function sanitizeSvgContent(rawSvg) {
  if (typeof rawSvg !== 'string') return '';

  let sanitized = rawSvg
    // Strip <script> tags
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    // Strip <foreignObject> tags
    .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, '')
    // Strip javascript: pseudo-protocol in href or xlink:href
    .replace(/(?:href|xlink:href)\s*=\s*["']\s*javascript:[^"']*["']/gi, '')
    // Strip inline DOM event handlers (onload, onclick, onerror, onmouseover, etc.)
    .replace(/\s+on[a-z]+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*[^"'\s>]+/gi, '');

  return sanitized;
}
