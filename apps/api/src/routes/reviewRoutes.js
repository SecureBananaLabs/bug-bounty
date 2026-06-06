import { Router } from "express";
import { getReviews, postReview } from "../controllers/reviewController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", postReview);
reviewRoutes.all("/", methodNotAllowed(["GET", "POST"]));
