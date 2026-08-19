export function validateCreateReview(payload) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid review payload" };
  }
  const { rating, comment, reviewerId, revieweeId } = payload;
  if (!reviewerId || typeof reviewerId !== "string" || reviewerId.trim() === "") {
    return { ok: false, error: "reviewerId is required" };
  }
  if (!revieweeId || typeof revieweeId !== "string" || revieweeId.trim() === "") {
    return { ok: false, error: "revieweeId is required" };
  }
  if (reviewerId.trim() === revieweeId.trim()) {
    return { ok: false, error: "Users cannot submit reviews for themselves" };
  }
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Rating must be an integer between 1 and 5" };
  }
  if (!comment || typeof comment !== "string" || comment.trim().length < 5) {
    return { ok: false, error: "Comment must be at least 5 characters" };
  }
  if (comment.trim().length > 1000) {
    return { ok: false, error: "Comment cannot exceed 1000 characters" };
  }

  return {
    ok: true,
    data: {
      reviewerId: reviewerId.trim(),
      revieweeId: revieweeId.trim(),
      rating,
      comment: comment.trim()
    }
  };
}
