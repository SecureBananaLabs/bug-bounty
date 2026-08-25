const { z } = require('zod');

const passwordComplexitySchema = z
  string()
  min(8, 'Password must be at least 8 characters long')
  regex(/[0-9]/, 'Password must contain at least one digit')
  regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

module.exports = {
  passwordComplexitySchema
};