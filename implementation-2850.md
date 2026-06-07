# Implementation for #2850

See issue #2850 for details.

## Bug

`POST /api/uploads` currently returns `201` with `success: true` even when the multipart request does not include a `file` field. The response reports `status: "no-file"`, but it is still treated as a successful upload by HTTP status and response shape.

## Expected fix

Reject upload requests that do not include a file with a clear `400` response, and keep successful upload responses reserved for requests that actually include `req.file`. Add route-level regression coverage for the miss