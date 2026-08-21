'use strict';

const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Collision-resistant id generation
//
// Previously ids were `rev_${Date.now()}`, so two reviews created within the
// same millisecond could receive identical ids. Ids are now composed of:
//
//   rev_<epochMs>_<sequence>_<entropy>
//
// - epochMs keeps ids time-sortable and preserves the legacy timestamp signal
// - sequence is a monotonic counter that advances on every same-millisecond
//   (or clock-rewind) request, guaranteeing uniqueness within this process
// - entropy is 48 bits from crypto.randomBytes, making cross-process and
//   cross-restart collisions impractical
// ---------------------------------------------------------------------------

let lastTimestamp = 0;
let sequence = 0;

function generateReviewId(now = Date.now()) {
  if (now <= lastTimestamp) {
    sequence += 1;
  } else {
    lastTimestamp = now;
    sequence = 0;
  }

  const entropy = crypto.randomBytes(6).toString('hex');
  return `rev_${now}_${sequence}_${entropy}`;
}

// In-memory review store.
const reviews = new Map();

function createReview(payload = {}) {
  const review = { id: generateReviewId(), ...payload };
  reviews.set(review.id, review);
  return review;
}

function getReviewById(id) {
  return reviews.get(id) || null;
}

function listReviews() {
  return Array.from(reviews.values());
}

function deleteReview(id) {
  return reviews.delete(id);
}

module.exports = {
  generateReviewId,
  createReview,
  getReviewById,
  listReviews,
  deleteReview,
};
