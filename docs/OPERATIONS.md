# Operations Guide - Defensive Snapshots

This document describes the design, configuration, and testing procedures for defensive snapshots in the Job Service.

## Defensive Snapshots

The application implements defensive snapshotting in `apps/api/src/services/jobService.js` to protect internal in-memory databases from accidental side-channel mutations.

### Design

By default, JavaScript objects and arrays are passed by reference. If a service returns its backing collection directly to route controllers or business logic, any caller can mutate the returned array or modify properties of nested items (like updating `job.status` or modifying the `skills` array), which silently corrupts the database state.

To prevent this:
1. **Array Cloning**: `listJobs()` maps over the backing array, cloning each element.
2. **Deep Copying**: Utilizes the native `structuredClone()` API to create complete, independent deep copies of job objects (including nested arrays like `skills`) before storing them and before returning them to callers.

### Testing

The implementation is verified by tests in `apps/api/src/tests/job.test.js`:
- **Object Mutation Protection**: Confirms that changing the status or modifying `skills` on a returned job does not alter subsequent lookups.
- **Array Mutation Protection**: Confirms that adding elements to the list returned by `listJobs()` does not alter the service state.
