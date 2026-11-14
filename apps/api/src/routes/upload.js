'use strict';

/**
 * Upload route — reject empty file submissions (fixes #2850).
 *
 * Previously the endpoint reported success even for zero-byte / missing
 * payloads. We now validate that a real, non-empty file was supplied
 * before persisting anything, and only then return success.
 */

const express = require('express');

const router = express.Router();

/** Persist a file; replace with the real storage layer. Returns a handle. */
async function persistFile({ filename, buffer }) {
  // return storage.put(filename, buffer);
  return { key: `uploads/${filename}`, size: buffer.length };
}

/** Best-effort cleanup for a partially written artifact. */
async function removeArtifact(handle) {
  if (!handle) return;
  // await storage.delete(handle.key);
}

/**
 * POST /upload
 * Accepts either multipart (req.file) or a JSON body { filename, content }.
 */
router.post('/', async (req, res) => {
  // Support multipart uploads (multer) and JSON base64/plain content.
  let filename;
  let buffer;

  if (req.file) {
    filename = req.file.originalname;
    buffer = req.file.buffer;
  } else if (req.body && typeof req.body === 'object') {
    filename = req.body.filename;
    const content = req.body.content;
    if (typeof content === 'string') {
      buffer = Buffer.from(content, req.body.encoding === 'base64' ? 'base64' : 'utf8');
    }
  }

  // 1) A file must actually be present.
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return res.status(400).json({ error: 'FILE_REQUIRED' });
  }

  // 2) Filename must be present and non-blank.
  if (!filename || typeof filename !== 'string' || filename.trim().length === 0) {
    return res.status(400).json({ error: 'FILENAME_REQUIRED' });
  }

  // 3) Reject zero-byte uploads — these are not valid deliverables.
  if (buffer.length === 0) {
    return res.status(400).json({ error: 'EMPTY_FILE' });
  }

  let handle = null;
  try {
    handle = await persistFile({ filename: filename.trim(), buffer });
  } catch (err) {
    await removeArtifact(handle);
    return res.status(500).json({ error: 'UPLOAD_FAILED' });
  }

  // Only report success once a non-empty file has been persisted.
  return res.status(201).json({
    ok: true,
    key: handle.key,
    size: handle.size,
  });
});

module.exports = router;
