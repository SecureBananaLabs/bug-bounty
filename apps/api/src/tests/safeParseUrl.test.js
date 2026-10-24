import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import safeParseUrl, {
  isDangerousProtocol,
  isPrivateIp,
  isOctalOrHexIp,
  parseIpv4ToNumber,
} from '../utils/safeParseUrl.js';

describe('safeParseUrl - Defensive URL Parsing & SSRF Hardening', () => {
  it('parses valid public HTTP and HTTPS URLs', () => {
    const parsed1 = safeParseUrl('https://api.example.com/v1/resource?id=123#overview');
    assert.ok(parsed1 instanceof URL);
    assert.strictEqual(parsed1.protocol, 'https:');
    assert.strictEqual(parsed1.hostname, 'api.example.com');
    assert.strictEqual(parsed1.pathname, '/v1/resource');
    assert.strictEqual(parsed1.search, '?id=123');
    assert.strictEqual(parsed1.hash, '#overview');

    const parsed2 = safeParseUrl('http://github.com');
    assert.ok(parsed2 instanceof URL);
    assert.strictEqual(parsed2.protocol, 'http:');
    assert.strictEqual(parsed2.hostname, 'github.com');
  });

  it('supports URL instance as input', () => {
    const initial = new URL('https://securebananalabs.com/path');
    const parsed = safeParseUrl(initial);
    assert.ok(parsed instanceof URL);
    assert.strictEqual(parsed.hostname, 'securebananalabs.com');
  });

  it('supports base URL resolution', () => {
    const parsed = safeParseUrl('/api/v2/users', 'https://banana.org');
    assert.ok(parsed instanceof URL);
    assert.strictEqual(parsed.href, 'https://banana.org/api/v2/users');
  });

  it('supports flexible signature safeParseUrl(input, options) omitting base', () => {
    const parsed = safeParseUrl('https://example.com/test#hash', { stripFragment: true });
    assert.ok(parsed instanceof URL);
    assert.strictEqual(parsed.hash, '');
    assert.strictEqual(parsed.pathname, '/test');
  });

  it('rejects null, undefined, empty, or non-string inputs', () => {
    assert.strictEqual(safeParseUrl(null), null);
    assert.strictEqual(safeParseUrl(undefined), null);
    assert.strictEqual(safeParseUrl(''), null);
    assert.strictEqual(safeParseUrl('   '), null);
    assert.strictEqual(safeParseUrl(12345), null);
    assert.strictEqual(safeParseUrl({}), null);
  });

  it('throws descriptive errors when throwOnError option is true', () => {
    assert.throws(
      () => safeParseUrl(null, { throwOnError: true }),
      /cannot be null or undefined/
    );
    assert.throws(
      () => safeParseUrl('not a valid url @@ ##', { throwOnError: true }),
      /Malformed URL/
    );
  });

  it('rejects illegal CRLF and control characters used in HTTP smuggling (CWE-113)', () => {
    assert.strictEqual(safeParseUrl('https://example.com/path\r\nInjected-Header: evil'), null);
    assert.strictEqual(safeParseUrl('https://example.com/path\nInjected: 1'), null);
    assert.strictEqual(safeParseUrl('https://example.com/\x00evil'), null);

    assert.throws(
      () => safeParseUrl('https://example.com/\r\n', { throwOnError: true }),
      /illegal control characters/
    );
  });

  it('blocks inherently dangerous protocols (CWE-79, CWE-918)', () => {
    assert.strictEqual(safeParseUrl('javascript:alert(1)'), null);
    assert.strictEqual(safeParseUrl('data:text/html,<script>alert(1)</script>'), null);
    assert.strictEqual(safeParseUrl('vbscript:msgbox(1)'), null);
    assert.strictEqual(safeParseUrl('file:///etc/passwd'), null);
    assert.strictEqual(safeParseUrl('blob:https://example.com/uuid'), null);

    assert.throws(
      () => safeParseUrl('javascript:void(0)', { throwOnError: true }),
      /Dangerous protocol "javascript:" is blocked/
    );
  });

  it('enforces protocol allowlist strictly', () => {
    // ftp is not in default allowed protocols ['http:', 'https:']
    assert.strictEqual(safeParseUrl('ftp://files.example.com'), null);

    // Custom allowed protocols
    const parsedFtp = safeParseUrl('ftp://files.example.com/doc', {
      allowedProtocols: ['ftp', 'http', 'https'],
    });
    assert.ok(parsedFtp instanceof URL);
    assert.strictEqual(parsedFtp.protocol, 'ftp:');
  });

  it('prevents SSRF attacks on loopback and private IPv4 ranges (CWE-918)', () => {
    // 127.0.0.0/8 Loopback
    assert.strictEqual(safeParseUrl('http://127.0.0.1/admin'), null);
    assert.strictEqual(safeParseUrl('http://127.0.0.2:8080/metrics'), null);
    assert.strictEqual(safeParseUrl('http://127.255.255.254/status'), null);

    // 10.0.0.0/8 Private
    assert.strictEqual(safeParseUrl('http://10.0.0.1/internal'), null);
    assert.strictEqual(safeParseUrl('http://10.254.1.5:9000'), null);

    // 172.16.0.0/12 Private
    assert.strictEqual(safeParseUrl('http://172.16.0.1'), null);
    assert.strictEqual(safeParseUrl('http://172.31.255.255'), null);

    // 192.168.0.0/16 Private
    assert.strictEqual(safeParseUrl('http://192.168.1.1/router'), null);
    assert.strictEqual(safeParseUrl('http://192.168.0.254'), null);

    // 169.254.0.0/16 Link-local & AWS Metadata
    assert.strictEqual(safeParseUrl('http://169.254.169.254/latest/meta-data/'), null);

    // 0.0.0.0/8
    assert.strictEqual(safeParseUrl('http://0.0.0.0'), null);

    // Multicast & Reserved
    assert.strictEqual(safeParseUrl('http://224.0.0.1'), null);
    assert.strictEqual(safeParseUrl('http://255.255.255.255'), null);
  });

  it('prevents SSRF attacks on localhost domain variations', () => {
    assert.strictEqual(safeParseUrl('http://localhost'), null);
    assert.strictEqual(safeParseUrl('http://localhost:3000/api'), null);
    assert.strictEqual(safeParseUrl('http://sub.localhost/api'), null);
    assert.strictEqual(safeParseUrl('http://deep.nested.localhost/test'), null);
  });

  it('prevents SSRF attacks on IPv6 private and loopback addresses', () => {
    // Loopback ::1
    assert.strictEqual(safeParseUrl('http://[::1]/debug'), null);
    assert.strictEqual(safeParseUrl('http://[::]/test'), null);

    // Unique local & Link-local
    assert.strictEqual(safeParseUrl('http://[fe80::1]/service'), null);
    assert.strictEqual(safeParseUrl('http://[fc00::1]/admin'), null);
    assert.strictEqual(safeParseUrl('http://[fd00::1]/admin'), null);

    // IPv4-mapped IPv6
    assert.strictEqual(safeParseUrl('http://[::ffff:127.0.0.1]/secret'), null);
  });

  it('detects and blocks obfuscated octal, hex, and DWORD IP SSRF bypasses', () => {
    // Octal representations of 127.0.0.1
    assert.strictEqual(safeParseUrl('http://0177.0.0.1'), null);
    assert.strictEqual(safeParseUrl('http://0177.0.0.01'), null);

    // Hex representations
    assert.strictEqual(safeParseUrl('http://0x7f.0.0.1'), null);
    assert.strictEqual(safeParseUrl('http://0x7f000001'), null);

    // DWORD representation (2130706433 = 127.0.0.1)
    assert.strictEqual(safeParseUrl('http://2130706433'), null);

    // Condensed notation (127.1 = 127.0.0.1)
    assert.strictEqual(safeParseUrl('http://127.1'), null);

    assert.throws(
      () => safeParseUrl('http://0177.0.0.1', { throwOnError: true }),
      /Octal, hexadecimal, or DWORD IPv4 representations are disallowed/
    );
  });

  it('permits private IPs when allowPrivateIps is explicitly true', () => {
    const parsed = safeParseUrl('http://127.0.0.1:8080/health', { allowPrivateIps: true });
    assert.ok(parsed instanceof URL);
    assert.strictEqual(parsed.hostname, '127.0.0.1');
    assert.strictEqual(parsed.port, '8080');

    const meta = safeParseUrl('http://169.254.169.254/latest/meta-data', { allowPrivateIps: true });
    assert.ok(meta instanceof URL);
    assert.strictEqual(meta.hostname, '169.254.169.254');
  });

  it('enforces allowedHosts allowlist', () => {
    const opts = { allowedHosts: ['example.com', '.trusted.io'] };

    const valid1 = safeParseUrl('https://example.com/path', opts);
    assert.ok(valid1 instanceof URL);

    const valid2 = safeParseUrl('https://sub.trusted.io/path', opts);
    assert.ok(valid2 instanceof URL);

    const invalid = safeParseUrl('https://evil.com/path', opts);
    assert.strictEqual(invalid, null);
  });

  it('enforces blockedHosts blocklist', () => {
    const opts = { blockedHosts: ['malicious.com', '.phishing.net'] };

    const blocked1 = safeParseUrl('https://malicious.com', opts);
    assert.strictEqual(blocked1, null);

    const blocked2 = safeParseUrl('https://login.phishing.net', opts);
    assert.strictEqual(blocked2, null);

    const allowed = safeParseUrl('https://safe-domain.com', opts);
    assert.ok(allowed instanceof URL);
  });

  it('validates port ranges and allowedPorts filter', () => {
    // Port 80 and 443 permitted
    const valid = safeParseUrl('https://example.com:443/data', { allowedPorts: [80, 443] });
    assert.ok(valid instanceof URL);

    // Port 8080 disallowed by filter
    const disallowed = safeParseUrl('https://example.com:8080/data', { allowedPorts: [80, 443] });
    assert.strictEqual(disallowed, null);
  });

  it('sanitizes authentication and fragments when options specify', () => {
    const parsed = safeParseUrl('https://admin:secret123@example.com/profile#access-token', {
      stripAuth: true,
      stripFragment: true,
    });

    assert.ok(parsed instanceof URL);
    assert.strictEqual(parsed.username, '');
    assert.strictEqual(parsed.password, '');
    assert.strictEqual(parsed.hash, '');
    assert.strictEqual(parsed.href, 'https://example.com/profile');
  });

  it('exposes standalone helper functions', () => {
    // isDangerousProtocol
    assert.strictEqual(isDangerousProtocol('javascript:'), true);
    assert.strictEqual(isDangerousProtocol('data'), true);
    assert.strictEqual(isDangerousProtocol('https'), false);

    // isPrivateIp
    assert.strictEqual(isPrivateIp('127.0.0.1'), true);
    assert.strictEqual(isPrivateIp('10.0.0.1'), true);
    assert.strictEqual(isPrivateIp('172.20.0.1'), true);
    assert.strictEqual(isPrivateIp('192.168.1.5'), true);
    assert.strictEqual(isPrivateIp('169.254.169.254'), true);
    assert.strictEqual(isPrivateIp('8.8.8.8'), false);
    assert.strictEqual(isPrivateIp('1.1.1.1'), false);
    assert.strictEqual(isPrivateIp('example.com'), false);

    // isOctalOrHexIp
    assert.strictEqual(isOctalOrHexIp('0177.0.0.1'), true);
    assert.strictEqual(isOctalOrHexIp('0x7f.0.0.1'), true);
    assert.strictEqual(isOctalOrHexIp('2130706433'), true);
    assert.strictEqual(isOctalOrHexIp('127.0.0.1'), false);
    assert.strictEqual(isOctalOrHexIp('example.com'), false);

    // parseIpv4ToNumber
    assert.strictEqual(parseIpv4ToNumber('127.0.0.1'), 2130706433);
    assert.strictEqual(parseIpv4ToNumber('10.0.0.1'), 167772161);
    assert.strictEqual(parseIpv4ToNumber('invalid'), null);

    // isValidUrl helper
    assert.strictEqual(safeParseUrl.isValidUrl('https://google.com'), true);
    assert.strictEqual(safeParseUrl.isValidUrl('http://127.0.0.1'), false);
  });
});
