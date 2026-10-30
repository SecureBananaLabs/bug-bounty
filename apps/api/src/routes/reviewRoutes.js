import { Router } from "express";
import { getReviews, postReview } from "../controllers/reviewController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", authMiddleware, postReview);
