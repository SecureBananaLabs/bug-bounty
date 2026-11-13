import { Router } from "express";
import { getReviews, postReview } from "../controllers/reviewController.js";
import { authMiddleware } from "../middleware/auth.js";

export const reviewRoutes = Router();

// Reviews belong to the account that writes them, so both handlers need the
// verified bearer identity instead of answering every anonymous caller.
reviewRoutes.use(authMiddleware);
reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", postReview);
