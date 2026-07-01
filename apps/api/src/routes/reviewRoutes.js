import { Router } from "express";
import { getReviews, postReview } from "../controllers/reviewController.js";
import { authMiddleware } from "../middleware/auth.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", authMiddleware, getReviews);
reviewRoutes.post("/", authMiddleware, postReview);