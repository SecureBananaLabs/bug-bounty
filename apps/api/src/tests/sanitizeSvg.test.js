const { sanitizeSvgContent } = require('../utils/sanitizeSvg');

describe('sanitizeSvgContent', () => {
  test('should return empty string for non-string input', () => {
    expect(sanitizeSvgContent(null)).toBe('');
    expect(sanitizeSvgContent(undefined)).toBe('');
    expect(sanitizeSvgContent(123)).toBe('');
    expect(sanitizeSvgContent({})).toBe('');
  });

  test('should remove script tags and their content', () => {
    const svg = '<svg><script>alert(1)</script></svg>';
    expect(sanitizeSvgContent(svg)).toBe('<svg></svg>');
  });

  test('should remove script tags with attributes', () => {
    const svg = '<svg><script type="text/javascript">alert(1)</script></svg>';
    expect(sanitizeSvgContent(svg)).toBe('<svg></svg>');
  });

  test('should remove self-closing script tags', () => {
    const svg = '<svg><script src="evil.js" /></svg>';
    expect(sanitizeSvgContent(svg)).toBe('<svg></svg>');
  });

  test('should remove event handler attributes', () => {
    const svg = '<svg onload="alert(1)"><rect onclick="alert(2)" /></svg>';
    const result = sanitizeSvgContent(svg);
    expect(result).not.toContain('onload');
    expect(result).not.toContain('onclick');
    expect(result).toBe('<svg><rect /></svg>');
  });

  test('should remove various event handlers', () => {
    const handlers = [
      'onload', 'onclick', 'onmouseover', 'onmouseout',
      'onkeydown', 'onkeyup', 'onfocus', 'onblur',
      'onerror', 'onabort', 'onresize', 'onscroll'
    ];
    handlers.forEach((handler) => {
      const svg = `<svg ${handler}="alert(1)"></svg>`;
      expect(sanitizeSvgContent(svg)).toBe('<svg></svg>');
    });
  });

  test('should remove javascript: URIs in href', () => {
    const svg = '<svg><a href="javascript:alert(1)">Click</a></svg>';
    const result = sanitizeSvgContent(svg);
    expect(result).not.toContain('javascript:');
    expect(result).toContain('href=""');
  });

  test('should remove javascript: URIs in xlink:href', () => {
    const svg = '<svg><a xlink:href="javascript:alert(1)">Click</a></svg>';
    const result = sanitizeSvgContent(svg);
    expect(result).not.toContain('javascript:');
    expect(result).toContain('xlink:href=""');
  });

  test('should remove javascript: URIs in src', () => {
    const svg = '<svg><image src="javascript:alert(1)" /></svg>';
    const result = sanitizeSvgContent(svg);
    expect(result).not.toContain('javascript:');
    expect(result).toContain('src=""');
  });

  test('should remove foreignObject elements', () => {
    const svg = '<svg><foreignObject><div>HTML content</div></foreignObject></svg>';
    expect(sanitizeSvgContent(svg)).toBe('<svg></svg>');
  });

  test('should remove iframe elements', () => {
    const svg = '<svg><iframe src="evil.com"></iframe></svg>';
    expect(sanitizeSvgContent(svg)).toBe('<svg></svg>');
  });

  test('should remove object and embed elements', () => {
    const svg = '<svg><object data="evil.swf"></object><embed src="evil.swf" /></svg>';
    expect(sanitizeSvgContent(svg)).toBe('<svg></svg>');
  });

  test('should remove style elements (CSS injection)', () => {
    const svg = '<svg><style>@import "evil.css";</style></svg>';
    expect(sanitizeSvgContent(svg)).toBe('<svg></svg>');
  });

  test('should preserve safe SVG elements and attributes', () => {
    const svg = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /><circle cx="50" cy="50" r="30" fill="red" /></svg>';
    expect(sanitizeSvgContent(svg)).toBe(svg);
  });

  test('should preserve safe attributes like viewBox, xmlns', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" /></svg>';
    expect(sanitizeSvgContent(svg)).toBe(svg);
  });

  test('should handle nested dangerous elements', () => {
    const svg = '<svg><g><script>alert(1)</script><foreignObject><iframe /></foreignObject></g></svg>';
    expect(sanitizeSvgContent(svg)).toBe('<svg><g></g></svg>');
  });

  test('should handle case-insensitive script tags', () => {
    const svg = '<svg><SCRIPT>alert(1)</SCRIPT><Script>alert(2)</Script></svg>';
    expect(sanitizeSvgContent(svg)).toBe('<svg></svg>');
  });

  test('should handle case-insensitive event handlers', () => {
    const svg = '<svg ONLOAD="alert(1)" OnClick="alert(2)"></svg>';
    const result = sanitizeSvgContent(svg);
    expect(result).not.toContain('ONLOAD');
    expect(result).not.toContain('OnClick');
    expect(result).toBe('<svg></svg>');
  });

  test('should handle javascript: with different casing', () => {
    const svg = '<svg><a href="JaVaScRiPt:alert(1)">Click</a></svg>';
    const result = sanitizeSvgContent(svg);
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('JaVaScRiPt:');
  });

  test('should handle malformed SVG gracefully', () => {
    const svg = '<svg><script>alert(1)<rect /></svg>';
    const result = sanitizeSvgContent(svg);
    expect(result).not.toContain('script');
    expect(result).not.toContain('alert');
  });

  test('should remove data: URIs that could contain scripts', () => {
    const svg = '<svg><image src="data:text/html,<script>alert(1)</script>" /></svg>';
    const result = sanitizeSvgContent(svg);
    expect(result).toContain('src=""');
  });

  test('should handle empty SVG', () => {
    expect(sanitizeSvgContent('')).toBe('');
    expect(sanitizeSvgContent('<svg></svg>')).toBe('<svg></svg>');
  });

  test('should handle SVG with only text content', () => {
    const svg = '<svg><text x="10" y="20">Hello World</text></svg>';
    expect(sanitizeSvgContent(svg)).toBe(svg);
  });

  test('should remove form elements', () => {
    const svg = '<svg><form><input type="text" /><button>Submit</button></form></svg>';
    expect(sanitizeSvgContent(svg)).toBe('<svg></svg>');
  });

  test('should remove video and audio elements', () => {
    const svg = '<svg><video><source src="video.mp4" /></video><audio><track /></audio></svg>';
    expect(sanitizeSvgContent(svg)).toBe('<svg></svg>');
  });
});
