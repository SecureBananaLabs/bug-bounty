import { Router } from "express";
import {
  createReviewController,
  listReviewsController,
} from "../controllers/reviewController.js";

export const reviewRoutes = Router();

reviewRoutes.post("/", createReviewController);
reviewRoutes.get("/", listReviewsController);
