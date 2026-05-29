# Benchmarking Suite

This directory contains the API benchmarking tools and configurations.

## Environment Variables

The following environment variables can be set in `.env.benchmark`:
- `TARGET_URL`: The base URL for the API endpoints (default: http://localhost:3000)
- `CONNECTIONS`: Number of concurrent connections (default: 10)
- `DURATION`: Test duration in seconds (default: 30)