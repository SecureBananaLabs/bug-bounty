/**
 * Sanitizes a filename by removing path separators, control characters,
 * and trimming whitespace. Also caps the filename length.
 * @param {string} filename - The original filename to sanitize
 * @param {number} maxLength - Maximum length for the sanitized filename (default: 100)
 * @returns {string} The sanitized filename
 */
function sanitizeFilename(filename, maxLength = 100) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file';
  }

  // Extract the final segment after the last path separator
  let sanitized = filename.split('\\').pop().split('/').pop();
  
  // Remove control characters (except tab, newline, carriage return which are handled separately)
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove any remaining path separators
  sanitized = sanitized.replace(/[\\/]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Replace multiple dots with a single dot and remove leading/trailing dots
  sanitized = sanitized.replace(/\.{2,}/g, '.').replace(/^\.+|\.+$/g, '');
  
  // If filename is empty after sanitization, use a default name
  if (!sanitized) {
    return 'unnamed_file';
  }
  
  // Cap the length
  if (sanitized.length > maxLength) {
    const lastDotIndex = sanitized.lastIndexOf('.');
    if (lastDotIndex !== -1 && lastDotIndex < maxLength - 5) {
      // Preserve extension if possible
      sanitized = sanitized.substring(0, maxLength - 4) + sanitized.substring(lastDotIndex);
    } else {
      // Truncate without preserving extension
      sanitized = sanitized.substring(0, maxLength);
    }
  }
  
  return sanitized;
}

module.exports = sanitizeFilename;