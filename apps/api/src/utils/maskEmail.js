/**
 * Safely masks email addresses for PII/GDPR privacy compliance in logs and public responses.
 * Example: 'john.doe@example.com' -> 'j***e@example.com'
 * 
 * @param {string} email - Raw email address.
 * @returns {string} Masked email string or empty string if invalid.
 */
export function maskEmail(email) {
  if (typeof email !== 'string') {
    return '';
  }
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0 || atIndex !== trimmed.lastIndexOf('@')) {
    return '';
  }

  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex + 1);

  if (!domainPart || !domainPart.includes('.')) {
    return '';
  }

  let maskedLocal;
  if (localPart.length <= 1) {
    maskedLocal = '*';
  } else if (localPart.length === 2) {
    maskedLocal = localPart[0] + '*';
  } else {
    maskedLocal = localPart[0] + '***' + localPart[localPart.length - 1];
  }

  return `${maskedLocal}@${domainPart}`;
}

export default maskEmail;
