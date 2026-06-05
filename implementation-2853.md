# Implementation for #2853

See issue #2853 for details.

Parent bounty: #743

## Bug
`createJobSchema` currently accepts payloads where `budgetMax` is lower than `budgetMin`. That creates invalid job records such as a USD 500-100 budget range and can break filtering, sorting, and display assumptions.

## Expected
- Job creation rejects inverted budget ranges.
- Partial job updates reject the same invalid range when both budget fields are present.
- Existing valid ordered ranges continue to parse successfully.

Related reissue: #2835