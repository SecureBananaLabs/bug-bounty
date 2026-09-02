import { randomUUID } from "crypto";
import { reviewSchema } from "@packages/db/schemas";
export function createReview(data: any) {
  const parsed = reviewSchema.parse(data);
  return { ...parsed, id: randomUUID() };
}
