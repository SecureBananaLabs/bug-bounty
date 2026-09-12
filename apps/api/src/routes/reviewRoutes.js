import { Router } from "express";
import { getReviews, postReview } from "../controllers/reviewController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", asyncHandler(getReviews));
reviewRoutes.post("/", asyncHandler(postReview));
