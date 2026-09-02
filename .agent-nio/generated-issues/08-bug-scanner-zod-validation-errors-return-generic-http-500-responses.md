# [bug-scanner] Zod validation errors return generic HTTP 500 responses

## Severity
medium

## Summary
Unhandled ZodError instances from schema.parse(req.body) bubble into the global error handler and become opaque 500 responses.

## Affected files
- `apps/api/src/controllers/authController.js`
- `apps/api/src/controllers/jobController.js`

## Location
- File: `apps/api/src/middleware/errorHandler.js`
- Line: 1

## Recommendation
Add an instanceof ZodError branch that responds with status 422 and structured field errors.

## Reproduction
1. Run `npm run scan:bugs -- --format json` from the repository root.
2. Confirm detector id `missing-zod-error-handler` reports this finding.

## Parent bounty
Automated by bug-scanner for bounty issue #11398.

This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #11398 for more information.