/**
 * Anonymizes IPv4 and IPv6 addresses for GDPR/privacy compliance.
 * - IPv4: Sets the last octet to 0 (e.g., 192.168.1.123 -> 192.168.1.0).
 * - IPv6: Sets the interface/host identifier to zeroes (preserving first 3 blocks: 2001:db8:85a3::).
 * - IPv4-mapped IPv6: Extracts and anonymizes the IPv4 portion (::ffff:192.168.1.1 -> ::ffff:192.168.1.0).
 * 
 * @param {string} ip - Raw IP address.
 * @returns {string} Anonymized IP string or empty string if invalid.
 */
const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6_MAPPED_REGEX = /^::ffff:(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/i;
const IPV6_REGEX = /^([0-9a-f]{1,4}:){1,7}:?([0-9a-f]{1,4})?$/i;

export function anonymizeIp(ip) {
  if (typeof ip !== 'string') {
    return '';
  }
  const trimmed = ip.trim();
  if (!trimmed) {
    return '';
  }

  // Handle IPv4-mapped IPv6 (e.g., ::ffff:192.168.1.1)
  if (IPV6_MAPPED_REGEX.test(trimmed)) {
    const parts = trimmed.split(':');
    const v4Part = parts[parts.length - 1];
    const octets = v4Part.split('.');
    octets[3] = '0';
    return `::ffff:${octets.join('.')}`;
  }

  // Standard IPv4
  if (IPV4_REGEX.test(trimmed)) {
    const octets = trimmed.split('.');
    octets[3] = '0';
    return octets.join('.');
  }

  // Standard IPv6
  if (trimmed === '::1') {
    return '::1'; // localhost loopback
  }
  if (trimmed.includes(':') && (IPV6_REGEX.test(trimmed) || trimmed.includes('::'))) {
    const segments = trimmed.split(':').filter(Boolean);
    if (segments.length >= 3) {
      return `${segments[0]}:${segments[1]}:${segments[2]}::`;
    }
    return `${segments.join(':')}::`;
  }

  return '';
}

export default anonymizeIp;
