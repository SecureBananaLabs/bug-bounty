/**
 * Defensive URL Parsing and Validation Utility
 * Hardened against Server-Side Request Forgery (SSRF) (CWE-918),
 * Protocol Smuggling / Cross-Site Scripting (CWE-79),
 * and Dangerous Protocol Exploits.
 *
 * @module utils/safeParseUrl
 */

const DEFAULT_ALLOWED_PROTOCOLS = Object.freeze(['http:', 'https:']);
const DEFAULT_BLOCKED_PROTOCOLS = Object.freeze([
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'blob:',
  'filesystem:',
  'about:',
]);

/**
 * Checks if a protocol is inherently dangerous.
 *
 * @param {string} protocol - Protocol string (with or without trailing colon)
 * @returns {boolean}
 */
export function isDangerousProtocol(protocol) {
  if (typeof protocol !== 'string') return false;
  const normalized = (protocol.endsWith(':') ? protocol : `${protocol}:`).toLowerCase();
  return DEFAULT_BLOCKED_PROTOCOLS.includes(normalized);
}

/**
 * Parses IPv4 address into a 32-bit unsigned numeric integer.
 * Handles standard dotted decimal, octal (e.g. 0177.0.0.1), hex (e.g. 0x7f.0.0.1),
 * DWORD integer (e.g. 2130706433), and condensed forms (e.g. 127.1).
 *
 * @param {string} host - Hostname or IP string
 * @returns {number|null} 32-bit unsigned integer or null if invalid IPv4
 */
export function parseIpv4ToNumber(host) {
  if (typeof host !== 'string' || !host.trim()) return null;
  const clean = host.replace(/^\[|\]$/g, '').trim();

  // If host contains domain alphabetic characters other than hex prefix '0x'/'0X', it is not pure IPv4
  if (/[^\d.xX]/.test(clean)) {
    return null;
  }

  const parts = clean.split('.');
  if (parts.length > 4 || parts.length === 0) return null;

  const nums = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].trim();
    if (p === '') return null;

    let n;
    if (p.startsWith('0x') || p.startsWith('0X')) {
      if (!/^0[xX][0-9a-fA-F]+$/.test(p)) return null;
      n = parseInt(p, 16);
    } else if (p.length > 1 && p.startsWith('0') && /^[0-7]+$/.test(p)) {
      n = parseInt(p, 8);
    } else if (/^\d+$/.test(p)) {
      n = parseInt(p, 10);
    } else {
      return null;
    }

    if (isNaN(n) || n < 0) return null;
    nums.push(n);
  }

  let ipNum = 0;
  if (nums.length === 1) {
    if (nums[0] > 0xffffffff) return null;
    ipNum = nums[0];
  } else if (nums.length === 2) {
    if (nums[0] > 255 || nums[1] > 0xffffff) return null;
    ipNum = (nums[0] * 16777216) + nums[1];
  } else if (nums.length === 3) {
    if (nums[0] > 255 || nums[1] > 255 || nums[2] > 0xffff) return null;
    ipNum = (nums[0] * 16777216) + (nums[1] * 65536) + nums[2];
  } else if (nums.length === 4) {
    if (nums.some((val) => val > 255)) return null;
    ipNum = (nums[0] * 16777216) + (nums[1] * 65536) + (nums[2] * 256) + nums[3];
  }

  return ipNum >>> 0;
}

/**
 * Checks if a 32-bit IPv4 numeric address falls in private/reserved CIDR blocks.
 *
 * @param {number} ipNum - 32-bit unsigned integer
 * @returns {boolean}
 */
function isPrivateIpv4Num(ipNum) {
  // 0.0.0.0/8 (0 - 16777215)
  if (ipNum <= 0x00ffffff) return true;
  // 10.0.0.0/8 (167772160 - 184549375)
  if (ipNum >= 0x0a000000 && ipNum <= 0x0affffff) return true;
  // 100.64.0.0/10 (1681915904 - 1686110207)
  if (ipNum >= 0x64400000 && ipNum <= 0x647fffff) return true;
  // 127.0.0.0/8 (2130706432 - 2147483647)
  if (ipNum >= 0x7f000000 && ipNum <= 0x7fffffff) return true;
  // 169.254.0.0/16 (2851995648 - 2852061183)
  if (ipNum >= 0xa9fe0000 && ipNum <= 0xa9feffff) return true;
  // 172.16.0.0/12 (2886729728 - 2887778303)
  if (ipNum >= 0xac100000 && ipNum <= 0xac1fffff) return true;
  // 192.168.0.0/16 (3232235520 - 3232301055)
  if (ipNum >= 0xc0a80000 && ipNum <= 0xc0a8ffff) return true;
  // 198.18.0.0/15 (3323068416 - 3323199487)
  if (ipNum >= 0xc6120000 && ipNum <= 0xc613ffff) return true;
  // 224.0.0.0/4 Multicast (3758096384 - 4026531839)
  if (ipNum >= 0xe0000000 && ipNum <= 0xefffffff) return true;
  // 240.0.0.0/4 Reserved & Broadcast (4026531840 - 4294967295)
  if (ipNum >= 0xf0000000 && ipNum <= 0xffffffff) return true;

  return false;
}

/**
 * Checks if a hostname or raw IP string uses octal, hex, or non-standard DWORD representations.
 * Attackers use these formats to bypass superficial string-based SSRF filters.
 *
 * @param {string} host - Hostname or raw input string
 * @returns {boolean}
 */
export function isOctalOrHexIp(host) {
  if (typeof host !== 'string' || !host.trim()) return false;
  const clean = host.replace(/^\[|\]$/g, '').trim();

  // Strip hex prefixes '0x'/'0X' before checking for non-hex letters
  const strippedHex = clean.replace(/0[xX][0-9a-fA-F]+/g, '');
  if (/[g-zG-Z\-_]/.test(strippedHex)) {
    return false;
  }

  const parts = clean.split('.');
  if (parts.length === 0 || parts.length > 4) return false;

  for (const p of parts) {
    if (!p) return false;
    // Check hex prefix
    if (/^0[xX][0-9a-fA-F]+$/.test(p)) {
      return true;
    }
    // Check octal prefix: leading zero on multi-digit number
    if (/^0[0-7]+$/.test(p) && p.length > 1) {
      return true;
    }
  }

  // Pure DWORD decimal integer without dots or condensed notation (e.g. 127.1)
  if (parts.length < 4 && parts.every((p) => /^\d+$/.test(p))) {
    return true;
  }

  return false;
}

/**
 * Validates whether an IP address, localhost, or hostname resolves to private/reserved network space.
 * Covers:
 * - 0.0.0.0/8 (Current network)
 * - 10.0.0.0/8 (Private RFC 1918)
 * - 100.64.0.0/10 (Shared Address Space / CGNAT)
 * - 127.0.0.0/8 (Loopback)
 * - 169.254.0.0/16 (Link-local / Cloud metadata service e.g. 169.254.169.254)
 * - 172.16.0.0/12 (Private RFC 1918)
 * - 192.168.0.0/16 (Private RFC 1918)
 * - 198.18.0.0/15 (Benchmark testing)
 * - 224.0.0.0/4 (Multicast)
 * - 240.0.0.0/4 (Reserved / Broadcast)
 * - localhost and *.localhost
 * - IPv6 ::1, ::, fe80::/10, fc00::/7, and IPv4-mapped IPv6
 *
 * @param {string} host - Hostname or IP
 * @returns {boolean} True if private, loopback, or reserved
 */
export function isPrivateIp(host) {
  if (typeof host !== 'string') return false;
  const clean = host.replace(/^\[|\]$/g, '').trim().toLowerCase();

  // Localhost checks
  if (clean === 'localhost' || clean.endsWith('.localhost') || clean === 'localhost.') {
    return true;
  }

  // IPv6 loopback and unspecified
  if (clean === '::1' || clean === '::' || clean === '0:0:0:0:0:0:0:1' || clean === '0:0:0:0:0:0:0:0') {
    return true;
  }

  // IPv6 unique local (fc00::/7, fd00::/8) and link-local (fe80::/10)
  if (clean.startsWith('fe8') || clean.startsWith('fe9') || clean.startsWith('fea') || clean.startsWith('feb') ||
      clean.startsWith('fc') || clean.startsWith('fd')) {
    return true;
  }

  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or hex-word format ::ffff:7f00:1)
  if (clean.startsWith('::ffff:')) {
    const sub = clean.slice(7);
    if (sub.includes('.')) {
      return isPrivateIp(sub);
    }
    const hexParts = sub.split(':');
    if (hexParts.length === 2) {
      const hi = parseInt(hexParts[0], 16);
      const lo = parseInt(hexParts[1], 16);
      if (!isNaN(hi) && !isNaN(lo)) {
        const mappedIpNum = (((hi & 0xffff) * 65536) + (lo & 0xffff)) >>> 0;
        return isPrivateIpv4Num(mappedIpNum);
      }
    }
    return true;
  }

  // IPv4 numerical evaluation
  const ipNum = parseIpv4ToNumber(clean);
  if (ipNum !== null) {
    return isPrivateIpv4Num(ipNum);
  }

  return false;
}

/**
 * Safely parses and validates a URL with SSRF protection and defensive guards.
 *
 * @param {string|URL} input - Raw URL string or URL instance
 * @param {string|URL|object} [base] - Base URL or options if base is omitted
 * @param {object} [options={}] - Validation options
 * @param {string[]} [options.allowedProtocols=['http:', 'https:']] - Allowlist of protocols
 * @param {string[]} [options.blockedProtocols] - Protocols explicitly rejected
 * @param {boolean} [options.allowPrivateIps=false] - Whether private/internal IPs are permitted (SSRF protection)
 * @param {boolean} [options.allowOctalHexIps=false] - Whether octal/hex/DWORD IPs are permitted
 * @param {string[]} [options.allowedHosts] - Allowlist of hostnames or domain suffixes
 * @param {string[]} [options.blockedHosts] - Blocklist of hostnames or domain suffixes
 * @param {(number|string)[]} [options.allowedPorts] - Allowlist of permitted ports
 * @param {boolean} [options.stripAuth=false] - Automatically strip username and password
 * @param {boolean} [options.stripFragment=false] - Automatically strip hash fragment
 * @param {boolean} [options.throwOnError=false] - Throw Error instead of returning null on failure
 * @returns {URL|null} Parsed and sanitized URL instance, or null if invalid
 */
export function safeParseUrl(input, base, options) {
  // Handle overloaded arguments (input, options)
  let resolvedBase = base;
  let opts = options;

  if (base !== null && typeof base === 'object' && !(base instanceof URL)) {
    opts = base;
    resolvedBase = undefined;
  }

  opts = opts || {};
  const {
    allowedProtocols = DEFAULT_ALLOWED_PROTOCOLS,
    blockedProtocols = DEFAULT_BLOCKED_PROTOCOLS,
    allowPrivateIps = false,
    allowOctalHexIps = false,
    allowedHosts,
    blockedHosts,
    allowedPorts,
    stripAuth = false,
    stripFragment = false,
    throwOnError = false,
  } = opts;

  function handleError(msg) {
    if (throwOnError) {
      throw new Error(`[safeParseUrl] ${msg}`);
    }
    return null;
  }

  // Validate input type
  if (input === null || input === undefined) {
    return handleError('Input URL cannot be null or undefined');
  }
  if (typeof input !== 'string' && !(input instanceof URL)) {
    return handleError(`Expected input to be a string or URL instance, received ${typeof input}`);
  }

  const rawInput = input instanceof URL ? input.href : String(input);

  // Detect malicious CRLF or control characters used in HTTP request splitting / smuggling before trimming
  if (/[\r\n\t\x00-\x1f\x7f]/.test(rawInput)) {
    return handleError('URL contains illegal control characters (CRLF/header injection risk)');
  }

  const rawString = rawInput.trim();
  if (rawString.length === 0) {
    return handleError('Input URL cannot be empty');
  }

  // Attempt URL construction
  let parsed;
  try {
    parsed = new URL(rawString, resolvedBase);
  } catch (err) {
    return handleError(`Malformed URL: ${err.message}`);
  }

  const protocol = parsed.protocol.toLowerCase();

  // Validate against dangerous protocols
  if (isDangerousProtocol(protocol) || blockedProtocols.map((p) => (p.endsWith(':') ? p : `${p}:`).toLowerCase()).includes(protocol)) {
    return handleError(`Dangerous protocol "${protocol}" is blocked`);
  }

  // Validate against allowed protocols
  const normalizedAllowed = allowedProtocols.map((p) => (p.endsWith(':') ? p : `${p}:`).toLowerCase());
  if (!normalizedAllowed.includes(protocol)) {
    return handleError(`Protocol "${protocol}" is not in the allowed protocols list`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    return handleError('URL hostname is missing or empty');
  }

  // Check for raw octal/hex/dword IP bypass attempts before or after WHATWG normalization
  const rawInputForIp = rawString.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '').split(/[/?#:]/)[0];
  if (!allowOctalHexIps) {
    if (isOctalOrHexIp(rawInputForIp) || isOctalOrHexIp(hostname)) {
      return handleError('Octal, hexadecimal, or DWORD IPv4 representations are disallowed');
    }
  }

  // SSRF Protection: Check for private, loopback, link-local, multicast, or reserved IPs
  if (!allowPrivateIps) {
    if (isPrivateIp(hostname) || isPrivateIp(rawInputForIp)) {
      return handleError(`SSRF Protection: Access to private or loopback host "${hostname}" is disallowed`);
    }
  }

  // Host allowlist / blocklist validation
  if (Array.isArray(allowedHosts) && allowedHosts.length > 0) {
    const isAllowed = allowedHosts.some((pattern) => {
      const lowerPat = pattern.toLowerCase();
      return hostname === lowerPat || (lowerPat.startsWith('.') && hostname.endsWith(lowerPat)) || hostname.endsWith(`.${lowerPat}`);
    });
    if (!isAllowed) {
      return handleError(`Hostname "${hostname}" is not in the allowed hosts list`);
    }
  }

  if (Array.isArray(blockedHosts) && blockedHosts.length > 0) {
    const isBlocked = blockedHosts.some((pattern) => {
      const lowerPat = pattern.toLowerCase();
      return hostname === lowerPat || (lowerPat.startsWith('.') && hostname.endsWith(lowerPat)) || hostname.endsWith(`.${lowerPat}`);
    });
    if (isBlocked) {
      return handleError(`Hostname "${hostname}" matches blocked hosts list`);
    }
  }

  // Port validation
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return handleError(`Port "${parsed.port}" is out of valid TCP range (1-65535)`);
    }
    if (Array.isArray(allowedPorts) && allowedPorts.length > 0) {
      const normalizedPorts = allowedPorts.map(Number);
      if (!normalizedPorts.includes(portNum)) {
        return handleError(`Port ${portNum} is not in the allowed ports list`);
      }
    }
  }

  // Sanitization mutations
  if (stripAuth) {
    parsed.username = '';
    parsed.password = '';
  }

  if (stripFragment) {
    parsed.hash = '';
  }

  return parsed;
}

/**
 * Convenience helper returning boolean validity.
 */
safeParseUrl.isValidUrl = function isValidUrl(input, base, options) {
  return safeParseUrl(input, base, options) !== null;
};

safeParseUrl.isDangerousProtocol = isDangerousProtocol;
safeParseUrl.isPrivateIp = isPrivateIp;
safeParseUrl.isOctalOrHexIp = isOctalOrHexIp;
safeParseUrl.parseIpv4ToNumber = parseIpv4ToNumber;
safeParseUrl.safeParseUrl = safeParseUrl;

export default safeParseUrl;
