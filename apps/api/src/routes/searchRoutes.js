import { Router } from "express";
import { search } from "../controllers/searchController.js";
import { authMiddleware } from "../middleware/auth.js";

export const searchRoutes = Router();

// The aggregate walks the same account, job and freelancer records the other
// routers protect, so it needs the verified bearer identity too.
searchRoutes.use(authMiddleware);
searchRoutes.get("/", search);
