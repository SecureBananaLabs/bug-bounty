import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { search } from "../controllers/searchController.js";

export const searchRoutes = Router();

searchRoutes.get("/", search);
