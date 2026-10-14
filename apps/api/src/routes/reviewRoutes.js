import { Router } from "express";
import { getReviews, postReview } from "../controllers/reviewController.js";
import { authMiddleware } from "../middleware/auth.js";

export const reviewRoutes = Router();

reviewRoutes.use(authMiddleware);
reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", postReview);mport { Router } from "express";
import { getReviews, postReview } from "../controllers/reviewController.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", postReview);
