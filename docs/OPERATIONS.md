# Operations Guide - Upload File Validation

This document describes the design, configuration, and testing procedures for the file upload endpoint.

## File Upload Validation

The application implements a check on the file upload endpoint (`POST /api/uploads`) in `apps/api/src/controllers/uploadController.js` to prevent empty upload submissions.

### Design

1. **Multer Parsing**: The endpoint uses `multer` memory storage to parse incoming multipart/form-data requests.
2. **File Check**: If the request body does not contain a valid `file` object (meaning `req.file` is undefined/missing), the endpoint rejects the request with a `400 Bad Request` status and a validation error message.
3. **Success Response**: If a valid file is uploaded, the API successfully saves the file metadata and returns a `201 Created` status with the file properties.

### Testing

The implementation is verified by tests in `apps/api/src/tests/upload.test.js`:
- **Missing File Verification**: Sends a POST request with an empty `FormData` payload and asserts that the API returns a `400` status with the correct error message.
- **Valid File Verification**: Appends a dummy text Blob to a `FormData` payload as the `file` field, posts it, and asserts that the API returns a `201` status along with the matching file properties.

Run the tests:
```bash
npm run test
```
