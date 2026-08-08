import { Router } from "express";
import { getReviews, postReview } from "../controllers/reviewController.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const reviewRoutes = Router();

reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", postReview);
