import { Router } from "express";
import { getReviews, postReview } from "../controllers/reviewController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const reviewRoutes = Router();

reviewRoutes.route("/")
  .get(getReviews)
  .post(postReview)
  .all(methodNotAllowed(["GET", "POST"]));
