import { Router } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { getReviews, postReview } from "../controllers/reviewController.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", catchAsync(getReviews));
reviewRoutes.post("/", catchAsync(postReview));
