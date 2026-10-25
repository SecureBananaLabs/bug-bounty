import { Router } from "express";
import { postReview } from "../controllers/reviewController";
import { authMiddleware } from "../middleware/authMiddleware";

const reviewRoutes = Router();

// Require authentication before allowing a review to be created
reviewRoutes.post("/", authMiddleware, postReview);

export default reviewRoutes;