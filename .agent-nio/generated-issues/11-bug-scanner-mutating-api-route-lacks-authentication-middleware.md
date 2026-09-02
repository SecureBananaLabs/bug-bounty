# [bug-scanner] Mutating API route lacks authentication middleware

## Severity
medium

## Summary
apps/api/src/routes/notificationRoutes.js exposes write endpoints without authMiddleware.

## Affected files
- `apps/api/src/routes/notificationRoutes.js`

## Location
- File: `apps/api/src/routes/notificationRoutes.js`
- Line: 7

## Recommendation
Protect state-changing routes with authMiddleware (and role checks where appropriate).

## Reproduction
1. Run `npm run scan:bugs -- --format json` from the repository root.
2. Confirm detector id `unprotected-mutating-route` reports this finding.

## Parent bounty
Automated by bug-scanner for bounty issue #11398.

This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #11398 for more information.