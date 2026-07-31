function validateSearchQuery(query) {
  // Check if query is a string
  if (typeof query !== 'string') {
    throw new Error('Search query must be a string');
  }

  // Trim whitespace
  const trimmedQuery = query.trim();

  // Check length (200 characters max)
  if (trimmedQuery.length > 200) {
    throw new Error('Search query must be 200 characters or less');
  }

  // Basic sanitization (remove special characters that could be used for injection)
  const sanitizedQuery = trimmedQuery.replace(/[^\w\s]/gi, '');

  return sanitizedQuery;
}

module.exports = {
  validateSearchQuery,
};