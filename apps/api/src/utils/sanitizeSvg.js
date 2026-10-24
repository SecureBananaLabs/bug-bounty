/**
 * @file sanitizeSvg.js
 * SVG content sanitizer protecting against Stored Cross-Site Scripting (XSS), malicious scripts, and event handlers.
 */

'use strict';

/**
 * Sanitizes SVG markup by removing executable scripts, dangerous HTML tags, event handler attributes,
 * and malicious URI schemes (javascript:, data:text/html).
 *
 * @param {string} rawSvg - The raw SVG string to sanitize.
 * @returns {string} The cleaned, XSS-safe SVG markup.
 */
export function sanitizeSvgContent(rawSvg) {
  if (rawSvg == null) {
    return '';
  }

  let svg = String(rawSvg);
  if (!svg.trim()) {
    return '';
  }

  // 1. Remove dangerous wrapper tags and their contents (<script>, <foreignObject>, <iframe>, <object>, <embed>, <applet>, <form>, <link>, <meta>)
  const dangerousTags = ['script', 'foreignObject', 'iframe', 'object', 'embed', 'applet', 'form', 'link', 'meta'];
  for (const tag of dangerousTags) {
    // Full tag pairs
    const tagRegex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    svg = svg.replace(tagRegex, '');

    // Self-closing tags
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    svg = svg.replace(selfClosingRegex, '');
  }

  // 2. Remove inline event handlers (e.g. onload, onerror, onclick, onmouseover, onfocus, etc.)
  // Matches on\w+\s*=\s*(['"][^'"]*['"]|[^\s>]+)
  svg = svg.replace(/\bon[a-zA-Z]+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '');

  // 3. Remove dangerous URI schemes in href / xlink:href / src attributes (javascript:, vbscript:, data:text/html)
  svg = svg.replace(/(href|xlink:href|src)\s*=\s*['"]\s*(javascript|vbscript|data:text\/html):[^'"]*['"]/gi, '$1=""');
  svg = svg.replace(/(href|xlink:href|src)\s*=\s*(javascript|vbscript|data:text\/html):[^\s>]+/gi, '$1=""');

  // 4. Remove CDATA sections containing executable scripts or javascript: URLs
  svg = svg.replace(/<!\[CDATA\[[\s\S]*?(javascript:|alert\(|eval\()[\s\S]*?\]\]>/gi, '');

  return svg.trim();
}
