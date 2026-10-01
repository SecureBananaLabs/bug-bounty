import { Router } from "express";
import { getReviews, postReview, getReviewsByJob } from "../controllers/reviewController.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", postReview);
reviewRoutes.get("/job/:jobId", getReviewsByJob);
