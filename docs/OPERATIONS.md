# Operations Guide - JSON Parsing Error Mappings

This document outlines the API error mappings for malformed JSON request bodies and oversized request payloads.

## Error Code Mapping

The API body parser enforces strict client error formatting to ensure malformed requests and oversized payloads receive standard HTTP status codes instead of generic server errors.

| Failure Condition | Parser Error Property | HTTP Status | Response Payload |
| :--- | :--- | :---: | :--- |
| **Malformed JSON** | `err instanceof SyntaxError && err.status === 400` | `400 Bad Request` | `{"success":false,"message":"Malformed JSON request body"}` |
| **Payload Too Large** | `err.status === 413 \|\| err.type === "entity.too.large"` | `413 Payload Too Large` | `{"success":false,"message":"Request entity too large"}` |
| **Other Errors** | All other uncaught exceptions | `500 Internal Server Error` | `{"success":false,"message":"Unexpected server error"}` |

### Configuration Enforcement
* The default body parser size limit is configured at `100kb`.
* Any request containing invalid JSON syntax will be rejected immediately at the parser level with a 400 status.
