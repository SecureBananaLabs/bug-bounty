import { Router } from "express";
import { getReviews, postReview } from "../controllers/reviewController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const schema = z.object({ rating: z.number().min(1).max(5), comment: z.string().optional(), targetId: z.string().min(1) }).strict();

export const reviewRoutes = Router();

reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", validate(schema), postReview);
