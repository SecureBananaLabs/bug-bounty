<content>
# API Server

## Environment Variables

This application requires the following environment variables to be set:

### JWT_SECRET
A secret key for signing JSON Web Tokens (JWTs).

**Security Requirements:**
- Must be at least 32 characters long
- Must be a strong, randomly generated string
- Should not be committed to version control
- Should be unique to each deployment environment (development, staging, production)

### How to set up

1. Generate a strong secret:
   ```bash
   openssl rand -base64 32
   ```

2. Set the environment variable in your `.env` file or deployment environment:
   ```env
   JWT_SECRET=your_generated_secret_here
   ```

3. Restart the application after setting the environment variable.

### Troubleshooting

If the application fails to start, it may be due to a missing or invalid `JWT_SECRET`. Check the error message for details about the configuration issue.
</content>