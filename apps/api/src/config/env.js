<content>
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET must be a non-empty string'),
});

const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
});

// Validate JWT_SECRET in production
if (env.NODE_ENV === 'production') {
  // Check if JWT_SECRET is the default development secret
  if (env.JWT_SECRET === 'development-secret') {
    throw new Error(
      'Using the default JWT_SECRET in production is not allowed. Please set a secure JWT_SECRET environment variable.'
    );
  }
  
  // Additional validation for production JWT_SECRET
  if (env.JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long in production. Please set a secure JWT_SECRET environment variable.'
    );
  }
}

export { env };
</content>