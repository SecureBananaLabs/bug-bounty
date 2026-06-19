import { Router } from "express";
import { getReviews, postReview } from "../controllers/reviewController.js";
import { validate } from "../middleware/validate.js";
import { createReviewSchema } from "../validators/review.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", validate(createReviewSchema), postReview);
