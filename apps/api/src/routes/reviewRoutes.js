import { Router } from "express";
import { getReview, getReviews, postReview } from "../controllers/reviewController.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", getReviews);
reviewRoutes.get("/:id", getReview);
reviewRoutes.post("/", postReview);
