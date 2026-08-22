/**
 * @file user.js
 * User creation and profile input validation with strict RFC 5322 email regex enforcement.
 */

'use strict';

/**
 * Standard RFC 5322 compliant email regex enforcing proper username, domain, and TLD formatting.
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates an email string against RFC 5322 format.
 *
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) {
    return false;
  }
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Validates user creation payload.
 *
 * @param {Object} payload
 * @returns {{ valid: boolean, error?: string, data?: Object }}
 */
export function validateCreateUser(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Valid email is required',
    };
  }

  const { email, name, role } = payload;

  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return {
      valid: false,
      error: 'Valid email is required',
    };
  }

  const sanitized = {
    email: email.trim().toLowerCase(),
    name: typeof name === 'string' ? name.trim() : '',
    role: role && ['client', 'freelancer', 'admin'].includes(role) ? role : 'client',
  };

  return {
    valid: true,
    data: sanitized,
  };
}
