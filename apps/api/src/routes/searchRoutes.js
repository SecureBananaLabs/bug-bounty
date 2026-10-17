import { Router } from "express";
import { search } from "../controllers/searchController.js";
import { authMiddleware } from "../middleware/auth.js";

export const searchRoutes = Router();

// Search results mix user, job and freelancer records, so the route needs a
// verified bearer token instead of answering every anonymous caller.
searchRoutes.get("/", authMiddleware, search);
