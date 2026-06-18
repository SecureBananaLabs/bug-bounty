import { validateSchema } from "../middleware/validationMiddleware.js";
import { ReviewSchema } from "../schemas/validationSchemas.js";
import { Router } from "express";
import { getReviews, postReview } from "../controllers/reviewController.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", postReview);
