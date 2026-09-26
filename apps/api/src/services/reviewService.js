import { getDb } from "../config/prisma.js";
import { ensureUser, mapReview, nextId } from "./persistenceHelpers.js";

export async function listReviews() {
  const db = getDb();
  const reviews = await db.review.findMany({
    orderBy: { createdAt: "asc" }
  });

  return reviews.map(mapReview);
}

export async function createReview(payload) {
  const db = getDb();
  const id = nextId("rev", payload.id);
  const reviewerId = payload.reviewerId ?? "usr_placeholder_reviewer";
  const revieweeId = payload.revieweeId ?? "usr_placeholder_reviewee";

  await ensureUser(reviewerId);
  await ensureUser(revieweeId);

  const review = await db.review.create({
    data: {
      id,
      rating: payload.rating ?? 0,
      comment: payload.comment ?? "",
      reviewerId,
      revieweeId
    }
  });

  return mapReview(review);
}
