## Summary

This PR fixes issue #2850 where `POST /api/uploads` returns `201` with `success: true` even when no file is provided.

## Changes

### 1. Upload Controller (`uploadController.js`)
- Added validation to check `req.file` exists before processing
- Returns `400` with clear error message when no file is provided
- Returns `201` with file metadata (filename, size, mimetype) only when file is present

### 2. Error Handler (`errorHandler.js`)
- Added proper handling for multer `LIMIT_*` errors
- Returns `400` status code instead of `500` for file upload validation errors

### 3. Test Coverage (`upload.test.js`)
Added comprehensive regression tests:
- ✅ No file field → 400 (primary fix)
- ✅ Empty body → 400
- ✅ Valid file upload → 201 with metadata
- ✅ Wrong field name → 400 (multer error handling)

## Test Results
```
✔ POST /api/uploads without file returns 400
✔ POST /api/uploads with empty body returns 400
✔ POST /api/uploads with file returns 201
✔ POST /api/uploads with wrong field name returns 400
```

## Before/After

**Before:**
```json
POST /api/uploads (no file)
→ 201 { success: true, data: { filename: null, status: "no-file" } }
```

**After:**
```json
POST /api/uploads (no file)
→ 400 { success: false, message: "No file provided in request" }
```

Fixes #2850
