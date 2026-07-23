# Operations Guide - Production Environment Requirements

This document outlines the environment requirements for deploying and running the api service in production environments.

## Environment Variables Configuration

### Production Enforcements
When running in a production environment (`NODE_ENV=production`), the application enforces security-critical configurations on startup. Missing required variables will cause the service to crash immediately rather than falling back to insecure defaults.

| Environment Variable | Mode | Required in Production | Description / Default |
| :--- | :--- | :---: | :--- |
| `NODE_ENV` | All | No | The execution environment (e.g. `development`, `production`). Defaults to `development`. |
| `PORT` | All | No | The port the server listens on. Defaults to `4000`. |
| `JWT_SECRET` | Production | **Yes** | Secret key used to sign and verify JSON Web Tokens. In development, defaults to `development-secret`. |
| `STRIPE_SECRET_KEY` | All | No | Secret key used for Stripe payment gateway communication. Defaults to `""`. |
| `DATABASE_URL` | All | No | Connection string for the database. Defaults to `""`. |

### Starting the Application in Production
Ensure `JWT_SECRET` is set in the environment before booting:

```bash
# Valid production start
export NODE_ENV=production
export JWT_SECRET=yoursupersecuresecretkeyhere123!
npm start

# Insecure/invalid production start (Will crash on boot)
export NODE_ENV=production
unset JWT_SECRET
npm start
```
