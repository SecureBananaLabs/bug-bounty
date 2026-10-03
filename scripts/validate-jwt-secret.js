<content>
#!/usr/bin/env node

/**
 * Script to validate JWT_SECRET configuration for production deployment
 * This should be run as part of pre-production checks
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  // Get current environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv !== 'production') {
    console.log(`Skipping JWT_SECRET validation for ${nodeEnv} environment`);
    process.exit(0);
  }

  // Check if JWT_SECRET is set
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    console.error('❌ JWT_SECRET environment variable is not set');
    process.exit(1);
  }

  // Check if it's the default development secret
  if (jwtSecret === 'development-secret') {
    console.error('❌ Using default JWT_SECRET in production is not allowed');
    process.exit(1);
  }

  // Check minimum length
  if (jwtSecret.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long in production');
    process.exit(1);
  }

  // Check for common weak patterns
  const weakPatterns = [
    /^password$/i,
    /^secret$/i,
    /^jwt$/i,
    /^token$/i,
    /^1234567890+$/,
    /^abcdefghij+/,
    /^0{8,}$/,
    /^1{8,}$/,
    /^2{8,}$/,
    /^3{8,}$/,
    /^4{8,}$/,
    /^5{8,}$/,
    /^6{8,}$/,
    /^7{8,}$/,
    /^8{8,}$/,
    /^9{8,}$/,
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(jwtSecret)) {
      console.error('❌ JWT_SECRET appears to be a weak or predictable pattern');
      process.exit(1);
    }
  }

  console.log('✅ JWT_SECRET validation passed');
  process.exit(0);
} catch (error) {
  console.error('❌ JWT_SECRET validation failed:', error.message);
  process.exit(1);
}
</content>