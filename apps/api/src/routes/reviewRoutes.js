import { Router } from "express";
import { getReviews, postReview, getReview } from "../controllers/reviewController.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", postReview);
reviewRoutes.get("/:id", getReview);
