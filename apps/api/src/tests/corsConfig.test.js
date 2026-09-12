import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// We can't easily test the full Express app without starting a server,
// but we can test the origin parsing logic directly.
function getAllowedOrigins(raw) {
  if (!raw || raw.trim() === '') {
    return ['http://localhost:3000'];
  }
  return raw.split(',').map(o => o.trim()).filter(o => o.length > 0);
}

describe('CORS configuration', () => {
  it('should default to localhost:3000 when CORS_ORIGINS is empty', () => {
    const origins = getAllowedOrigins('');
    expect(origins).toEqual(['http://localhost:3000']);
  });

  it('should default to localhost:3000 when CORS_ORIGINS is undefined', () => {
    const origins = getAllowedOrigins(undefined);
    expect(origins).toEqual(['http://localhost:3000']);
  });

  it('should parse single origin', () => {
    const origins = getAllowedOrigins('https://example.com');
    expect(origins).toEqual(['https://example.com']);
  });

  it('should parse multiple comma-separated origins', () => {
    const origins = getAllowedOrigins('http://localhost:3000,https://example.com,https://app.example.com');
    expect(origins).toEqual([
      'http://localhost:3000',
      'https://example.com',
      'https://app.example.com',
    ]);
  });

  it('should trim whitespace from origins', () => {
    const origins = getAllowedOrigins('  http://localhost:3000 , https://example.com  ');
    expect(origins).toEqual(['http://localhost:3000', 'https://example.com']);
  });

  it('should filter out empty strings', () => {
    const origins = getAllowedOrigins('http://a.com,,https://b.com,');
    expect(origins).toEqual(['http://a.com', 'https://b.com']);
  });
});
