# Implementation for #2835

See issue #2835 for details.

## Bug

`createJobSchema` currently accepts payloads where `budgetMax` is lower than `budgetMin`. That creates invalid job records such as a USD 500-100 budget range and can break client-side filtering, sorting, and display assumptions.

## Expected behavior

- Job creation should reject inverted budget ranges.
- Partial job updates should reject the same invalid range when both budget fields are present.
- Existing valid ordered ranges should continue to parse successfully.

This issue is limit