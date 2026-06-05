import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getReviews, postReview } from "../controllers/reviewController.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", requireAuth, getReviews);
reviewRoutes.post("/", requireAuth, postReview);