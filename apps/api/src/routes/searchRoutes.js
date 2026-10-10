import { Router } from "express";
import { search } from "../controllers/searchController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const searchRoutes = Router();

searchRoutes.route("/")
  .get(search)
  .all(methodNotAllowed(["GET"]));
