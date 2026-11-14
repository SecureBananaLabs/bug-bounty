# OAuth Provider Allowlist Demo

This demo supports PR #1027 and scoped issue #1025.

The WebM file in this directory shows the OAuth provider allowlist behavior and
the focused validation command:

```bash
node --test apps/api/src/tests/oauthProviders.test.js
```

Expected result:

- `github` and `google` remain supported callback providers.
- Unknown, path-like, or empty provider names are rejected by the allowlist.
- The focused node:test suite passes.

No secrets, credentials, or private execution instructions are included in the
demo artifact.
