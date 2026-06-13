// Simple sanitization function to remove potential XSS characters
const sanitize = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

export { sanitize };