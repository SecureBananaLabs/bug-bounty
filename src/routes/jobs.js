fix(jobs): resolve mock jobs by id in the job detail route (#2790)

Problem
-------
GET /api/jobs/:id returned 404 for every mock job because the detail route
looked the job up with a strict string comparison against a numeric `id`
field (and only ever consulted the in-memory seed array by array index).
Any request whose `:id` was a valid seeded job id failed to resolve, so the
job detail page was effectively broken for all mock data.

Fix
---
- Normalize the `:id` path param: reject empty/non-numeric ids with 400.
- Build an O(1) `Map<number, Job>` index from the mock job seed once at
  module load, keyed by the numeric job id.
- Resolve the job via that index, returning 404 with a structured error
  when the id is well-formed but not present.
- Strip internal-only fields before responding, mirroring the profile route.

src/routes/jobs.js
------------------
const express = require('express');
const router = express.Router();
const { mockJobs } = require('../data/mockJobs');

// Prebuilt O(1) index: numeric job id -> job record.
const jobsById = new Map();
for (const job of mockJobs) {
  const id = Number(job.id);
  if (Number.isFinite(id)) jobsById.set(id, job);
}

const INTERNAL_FIELDS = new Set(['_internal', '__v', 'seedSource']);

function publicJob(job) {
  const out = {};
  for (const [key, value] of Object.entries(job)) {
    if (!INTERNAL_FIELDS.has(key)) out[key] = value;
  }
  return out;
}

// GET /api/jobs/:id — resolve a mock job by its numeric id.
router.get('/:id', (req, res) => {
  const raw = req.params.id;

  if (typeof raw !== 'string' || raw.trim() === '') {
    return res.status(400).json({ error: 'Job id is required.' });
  }
  if (!/^\d+$/.test(raw.trim())) {
    return res.status(400).json({ error: 'Job id must be a positive integer.' });
  }

  const id = Number(raw.trim());
  const job = jobsById.get(id);

  if (!job) {
    return res.status(404).json({ error: `Job ${id} not found.` });
  }

  return res.status(200).json({ job: publicJob(job) });
});

module.exports = router;

Notes
-----
- No behavior change for well-formed ids that already resolved.
- 400 for malformed ids (empty, non-numeric) instead of a confusing 404.
- 404 remains for well-formed-but-absent ids.
- O(1) lookup replaces the previous linear/index-based scan.
