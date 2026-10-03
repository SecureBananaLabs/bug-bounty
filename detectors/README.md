<content>
# Bug Detection System

A comprehensive automated bug detection system that scans codebases for security vulnerabilities and code quality issues.

## Features

- **8 Detectors**: Covers common security and code quality issues
  - Hardcoded JWT Secret
  - Zod Parse Without Try-Catch
  - In-Memory Storage Usage
  - Unhandled Zod Errors in Express Routes
  - Unrestricted CORS
  - Next.js Params Not Awaited
  - Exposed Development Secrets
  - TODO Placeholders

- **Automated Issue Creation**: Automatically creates GitHub issues for detected bugs
- **CI Integration**: Scheduled runs and runs on code changes
- **Configurable**: Easy to enable/disable detectors and adjust scan paths

## Installation

1. Add this detector package to your project
2. Configure the GitHub workflow for your repository
3. Set up the necessary secrets

## Usage

### Manual Run

```bash
node detectors/bug-detector.js
```

### CI Integration

The system is designed to run automatically in CI/CD pipelines:

- Scheduled runs (daily at 2 AM UTC)
- Runs on push to main/master/develop branches
- Runs on pull requests to main/master/develop branches

## Configuration

Set the following environment variables:

- `GITHUB_TOKEN`: GitHub personal access token with repo permissions
- `GITHUB_REPO`: Repository name in format "owner/repo"
- `SCAN_PATHS`: Comma-separated list of paths to scan (defaults to current directory)

## Detectors

### Hardcoded JWT Secret

Detects JWT secrets hardcoded in source code files.

**Severity**: High

**Recommendation**: Move JWT secrets to environment variables or a secure secret management system.

### Zod Parse Without Try-Catch

Detects Zod parse() calls that aren't wrapped in try-catch blocks.

**Severity**: Medium

**Recommendation**: Use .safeParse() instead of .parse() or wrap parse() calls in try-catch blocks.

### In-Memory Storage Usage

Detects usage of in-memory storage solutions like Map, Set, localStorage, etc.

**Severity**: Medium

**Recommendation**: Use a persistent database like PostgreSQL, MongoDB, or Redis for production data storage.

### Unhandled Zod Errors in Express Routes

Detects unhandled Zod parsing errors in Express routes that could crash the server.

**Severity**: High

**Recommendation**: Implement proper error handling for Zod parsing in all Express routes.

### Unrestricted CORS

Detects CORS configurations that allow any origin.

**Severity**: High

**Recommendation**: Configure CORS with specific allowed origins, methods, and headers.

### Next.js Params Not Awaited

Detects potential issues with async parameters in Next.js data fetching functions.

**Severity**: Medium

**Recommendation**: Ensure all async operations in Next.js data fetching functions are properly awaited.

### Exposed Development Secrets

Detects hardcoded secrets in source code and configuration files.

**Severity**: High

**Recommendation**: Move all secrets to environment variables or secure secret management systems.

### TODO Placeholders

Detects TODO comments that indicate unfinished work.

**Severity**: Low

**Recommendation**: Address all TODO comments or remove them if they are no longer relevant.

## Contributing

To add new detectors:

1. Add a new detector configuration in `bug-detector.js`
2. Add a detector definition with description and recommendation
3. Update the issue template if needed
4. Add tests for the new detector

## License

MIT
</content>