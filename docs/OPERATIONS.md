# Operations Guide - Search Query Validation

This document describes the design, configuration, and testing procedures for the search query validation feature.

## Search Query Normalization & Validation

The application implements query parameter validation in the `/api/search` endpoint controller to protect downstream search services.

### Design

1. **Omitted and Empty Inputs**: If the query query-parameter (`req.query.q`) is omitted, undefined, or null, it defaults safely to an empty string `""` without failing.
2. **String Coercion**: Values are coerced to string objects to prevent type issues.
3. **Whitespace Trimming**: Surrounding whitespace is stripped from the search term using `.trim()`.
4. **Length Restriction**: Overly long query values are rejected immediately with a `400 Bad Request` code. The maximum length limit is set to `100` characters.

### Testing

The implementation is verified by tests in `apps/api/src/tests/search.test.js`:
- **Trimming Validation**: Asserts that query values with surrounding spaces are trimmed correctly.
- **Empty Query Gracefulness**: Asserts that empty/omitted inputs default to `""` and resolve with code `200`.
- **String Coercion**: Asserts that numeric search queries are coerced to strings.
- **Overly Long Validation**: Asserts that inputs exceeding `100` characters fail with status code `400`.

Run the tests:
```bash
npm run test
```
