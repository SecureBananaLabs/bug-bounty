<content>
# JWT Secret Security

## Overview

The JWT secret is a critical security component used to sign and verify JSON Web Tokens in our application. Proper configuration is essential to prevent token forgery and unauthorized access.

## Requirements

### Production Environments

In production environments (`NODE_ENV=production`), the following requirements must be met:

1. **JWT_SECRET must be set**: The `JWT_SECRET` environment variable must be defined and cannot be empty.
2. **No default secrets**: Using the default `development-secret` is explicitly forbidden.
3. **Minimum length**: The JWT secret must be at least 32 characters long.
4. **High entropy**: The secret should be a cryptographically secure random string with high entropy.

### Development and Test Environments

In development and test environments, the application will allow the use of the default `development-secret` for convenience, but it's still recommended to use custom secrets.

## Configuration Examples

### Production (Correct)
```bash
export NODE_ENV=production
export JWT_SECRET="a-very-strong-and-long-production-jwt-secret-that-is-at-least-32-characters-long"
```

### Production (Incorrect - will fail)
```bash
export NODE_ENV=production
export JWT_SECRET="development-secret"  # Will cause application to fail
```

### Development (Allowed)
```bash
export NODE_ENV=development
# JWT_SECRET can be omitted or set to development-secret
```

## Generating a Secure JWT Secret

For production environments, generate a secure random secret using one of these methods:

### Using OpenSSL
```bash
openssl rand -base64 32
```

### Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Security Best Practices

1. **Never commit secrets**: Never commit JWT secrets to version control.
2. **Rotate secrets**: Regularly rotate JWT secrets in production.
3. **Environment-specific secrets**: Use different secrets for different environments.
4. **Access control**: Limit access to the environment variables containing JWT secrets.
5. **Monitoring**: Monitor for suspicious token usage patterns.

## Troubleshooting

### "Using the default JWT_SECRET in production is not allowed"
This error occurs when the application detects that the production environment is using the default development secret. To resolve:
1. Set a secure JWT_SECRET environment variable
2. Ensure it's at least 32 characters long
3. Verify it's not set to "development-secret"

### "JWT_SECRET must be a non-empty string"
This error occurs when the JWT_SECRET environment variable is either not set or is an empty string. To resolve:
1. Set the JWT_SECRET environment variable to a non-empty string
2. For production, ensure it meets the additional security requirements
</content>