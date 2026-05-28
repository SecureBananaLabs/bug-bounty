import { Router } from "express";
import { search } from "../controllers/searchController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const searchRoutes = Router();

searchRoutes.get("/", asyncHandler(search));
