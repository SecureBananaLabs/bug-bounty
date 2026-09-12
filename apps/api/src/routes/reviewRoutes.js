import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getReviews, postReview } from "../controllers/reviewController.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", authMiddleware, postReview);
