import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getReviews, postReview } from "../controllers/reviewController.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", postReview);
