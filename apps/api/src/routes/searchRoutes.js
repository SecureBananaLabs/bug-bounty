import { Router } from "express";
import { search } from "../controllers/searchController.js";
import { authMiddleware } from "../middleware/auth.js";

export const searchRoutes = Router();

searchRoutes.get("/", authMiddleware, search);
