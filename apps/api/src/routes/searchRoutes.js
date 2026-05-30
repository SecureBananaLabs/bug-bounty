import { Router } from "express";
import { search } from "../controllers/searchController.js";
import { validateQuery } from "../middleware/validate.js";
import { searchQuerySchema } from "../validators/search.js";
import { createSearchLimiter } from "../middleware/searchRateLimit.js";

export function createSearchRoutes() {
  const router = Router();
  const searchLimiter = createSearchLimiter();
  router.get("/", searchLimiter, validateQuery(searchQuerySchema), search);
  return router;
}
