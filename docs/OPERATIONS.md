# Operations Guide - Unique ID Generation

This document describes the design, configuration, and testing procedures for the shared unique ID generation service.

## Unique ID Generation

The application implements a thread-safe collision-free unique ID generator in `apps/api/src/utils/id.js` to replace standard `Date.now()` service IDs.

### Design

To guarantee uniqueness even when multiple records are created within the same millisecond or when `Date.now()` is stubbed in tests, the generator combines three components:
1. **Readable Prefix**: The service-specific prefix (e.g. `usr_`, `job_`, `rev_`).
2. **Current Timestamp**: Date.now() millisecond timestamp (retains readable format).
3. **Wrapping Counter**: A thread-safe counter that increments with every call and wraps at `10000`.
4. **Random Suffix**: A cryptographically random suffix between `0000` and `9999` to ensure process and thread safety.

### Testing

The implementation is verified by tests in `apps/api/src/tests/id.test.js`:
- **Format Validation**: Confirms the prefix and readable timestamp format are preserved.
- **Same-Millisecond Regression**: Stubs `Date.now` to a static value and asserts that generating 1,000 IDs in sequence yields 1,000 unique keys.

Run the tests:
```bash
npm run test
```
