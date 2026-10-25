import express from "express";
import { postReview } from "../controllers/reviewController";
import authMiddleware from "../middleware/authMiddleware";

const reviewRoutes = express.Router();

// Apply authentication middleware before handling the review creation
reviewRoutes.post("/", authMiddleware, postReview);

export default reviewRoutes;