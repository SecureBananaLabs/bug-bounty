# [bug-scanner] Missing request-body validation in getNotifications

## Severity
high

## Summary
getNotifications forwards req.body to a service without Zod (or similar) validation.

## Affected files
- `apps/api/src/controllers/notificationController.js`

## Location
- File: `apps/api/src/controllers/notificationController.js`
- Line: 4

## Recommendation
Add a validator schema and call schema.parse(req.body) before invoking the service layer.

## Reproduction
1. Run `npm run scan:bugs -- --format json` from the repository root.
2. Confirm detector id `unvalidated-request-body` reports this finding.

## Parent bounty
Automated by bug-scanner for bounty issue #11398.

This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #11398 for more information.