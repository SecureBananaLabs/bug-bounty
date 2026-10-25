// fix(#2849): freelancer profile route should resolve mock profiles by username
//
// Problem: GET /api/profiles/:identifier only resolved profiles by numeric id.
// Requests using a username (e.g. /api/profiles/jane-doe) fell through to a
// 404 even though the mock dataset contains that username, breaking public
// profile links.
//
// Fix: resolve the identifier against BOTH `id` and `username`. Numeric
// identifiers keep the existing id lookup; non-numeric identifiers are matched
// case-insensitively against `username`. Lookup is O(1) via a prebuilt index,
// and the response never leaks internal fields.

const express = require('express');
const router = express.Router();

// Mock dataset (in a real app this comes from the DB layer).
const mockProfiles = require('../data/mockProfiles');

// Prebuilt username -> profile index for O(1) resolution.
const profilesByUsername = new Map(
  mockProfiles.map((p) => [String(p.username).toLowerCase(), p])
);
const profilesById = new Map(
  mockProfiles.map((p) => [String(p.id), p])
);

// Strip internal-only fields before returning to the client.
function toPublicProfile(profile) {
  const { id, username, displayName, headline, skills, avatarUrl } = profile;
  return { id, username, displayName, headline, skills, avatarUrl };
}

// GET /api/profiles/:identifier  — identifier may be a numeric id OR a username.
router.get('/:identifier', (req, res) => {
  const raw = req.params.identifier;
  if (typeof raw !== 'string' || raw.trim() === '') {
    return res.status(400).json({ error: 'identifier is required' });
  }
  const identifier = raw.trim();

  // Numeric identifiers -> resolve by id; otherwise -> resolve by username.
  const profile = /^\d+$/.test(identifier)
    ? profilesById.get(identifier)
    : profilesByUsername.get(identifier.toLowerCase());

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  return res.status(200).json({ profile: toPublicProfile(profile) });
});

module.exports = router;
