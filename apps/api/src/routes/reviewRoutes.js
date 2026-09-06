import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getReviews, postReview } from "../controllers/reviewController.js";


const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  message: { error: "Too many reviews. Try again later." },
});

export const reviewRoutes = Router();

reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", reviewLimiter, postReview);
