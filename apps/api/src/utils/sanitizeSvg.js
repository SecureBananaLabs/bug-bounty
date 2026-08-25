/**
 * Sanitizes SVG content to prevent stored XSS attacks.
 * Strips <script> tags, event handlers, javascript: URIs, and dangerous elements.
 *
 * @param {string} rawSvg - The raw SVG content to sanitize
 * @returns {string} - Sanitized SVG content
 */
function sanitizeSvgContent(rawSvg) {
  if (typeof rawSvg !== 'string') {
    return '';
  }

  let svg = rawSvg;

  // Remove <script> tags and their content (case-insensitive, including nested)
  svg = svg.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  svg = svg.replace(/<script\b[^>]*\/>/gi, '');

  // Remove event handler attributes (onload, onclick, onmouseover, etc.)
  svg = svg.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  svg = svg.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

  // Remove javascript: URIs in attributes (href, xlink:href, etc.)
  svg = svg.replace(/(\s+(?:href|xlink:href|src)\s*=\s*["'])\s*javascript:[^"']*["']/gi, '$1""');
  svg = svg.replace(/(\s+(?:href|xlink:href|src)\s*=\s*)javascript:[^\s>]+/gi, '$1""');

  // Remove dangerous elements entirely
  const dangerousElements = [
    'script',
    'foreignObject',
    'iframe',
    'frame',
    'frameset',
    'object',
    'embed',
    'applet',
    'meta',
    'link',
    'style',
    'base',
    'form',
    'input',
    'button',
    'textarea',
    'select',
    'option',
    'video',
    'audio',
    'source',
    'track',
    'marquee',
    'isindex'
  ];

  dangerousElements.forEach((tag) => {
    // Remove opening and closing tags with content
    const regex = new RegExp(`<${tag}\b[^>]*>[\s\S]*?<\/${tag}>`, 'gi');
    svg = svg.replace(regex, '');
    // Remove self-closing tags
    svg = svg.replace(new RegExp(`<${tag}\b[^>]*\/>`, 'gi'), '');
    // Remove opening tags without closing (malformed)
    svg = svg.replace(new RegExp(`<${tag}\b[^>]*>`, 'gi'), '');
  });

  // Remove any remaining event handler attributes that might have been missed
  svg = svg.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  svg = svg.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

  // Remove javascript: protocol from any attribute value
  svg = svg.replace(/(["'])\s*javascript:/gi, '$1');

  // Remove data: URIs that could contain scripts (optional, but safer)
  svg = svg.replace(/(\s+(?:href|xlink:href|src)\s*=\s*["'])\s*data:[^"']*["']/gi, '$1""');

  // Trim and return
  return svg.trim();
}

module.exports = { sanitizeSvgContent };
