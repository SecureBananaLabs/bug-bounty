import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { search } from "../controllers/searchController.js";

export const searchRoutes = Router()

router searchRoutes.use(authMiddleware);

searchRoutes.get("/", search);
