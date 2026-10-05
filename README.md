# Environment Variables

Each app/package expects its own `.env` values for DB, auth, and integrations.

## API Environment Variables

The API requires the following environment variables to be set in `apps/api/.env`:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Node environment (development, production, test) | No | `development` |
| `PORT` | Port number for the API server | No | `4000` |
| `JWT_SECRET` | Secret key for JSON Web Token authentication | No | `development-secret` |
| `STRIPE_SECRET_KEY` | Secret key for Stripe payment processing | No | (empty string) |
| `DATABASE_URL` | Connection string for the database | Yes | (empty string) |

### Setting up the environment

1. Copy the example environment file:
   ```
   cp apps/api/.env.example apps/api/.env
   ```

2. Update the values in `apps/api/.env` with your actual configuration.

3. Ensure `DATABASE_URL` is properly set with your database connection string for the API to start successfully.

### Web App Environment Variables

The web app also requires its own environment variables which will be documented separately.