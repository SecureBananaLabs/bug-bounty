<content>
const createReview = (payload) => {
  const review = { id: `rev_${Date.now()}`, ...payload };
  // ... rest of the implementation
  return review;
};

module.exports = {
  createReview,
};
</content>