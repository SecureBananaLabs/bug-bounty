# [bug-scanner] Insecure default secret in environment config

## Severity
high

## Summary
Configuration falls back to a hard-coded default ("development-secret") when an env var is missing.

## Affected files
- `apps/api/src/config/env.js`

## Location
- File: `apps/api/src/config/env.js`
- Line: 4

## Recommendation
Require secrets via environment variables in non-development environments and fail fast when unset.

## Reproduction
1. Run `npm run scan:bugs -- --format json` from the repository root.
2. Confirm detector id `hardcoded-secret-fallback` reports this finding.

## Parent bounty
Automated by bug-scanner for bounty issue #11398.

This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #11398 for more information.