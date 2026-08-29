import crypto from 'node:crypto';

/**
 * Generates a cryptographically secure random token string.
 * @param {number} [bytes=32] - Number of random bytes
 * @param {'hex' | 'base64' | 'base64url' | 'alphanumeric'} [encoding='hex'] - Output format
 * @returns {string} Secure random token
 */
export function generateSecureToken(bytes = 32, encoding = 'hex') {
  const byteLength = typeof bytes === 'number' && bytes > 0 ? Math.floor(bytes) : 32;
  const buffer = crypto.randomBytes(byteLength);

  if (encoding === 'base64') {
    return buffer.toString('base64');
  }

  if (encoding === 'base64url') {
    return buffer.toString('base64url');
  }

  if (encoding === 'alphanumeric') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < byteLength; i++) {
      result += chars[buffer[i] % chars.length];
    }
    return result;
  }

  return buffer.toString('hex');
}
