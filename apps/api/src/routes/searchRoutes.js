import { Router } from "express";
import { search } from "../controllers/searchController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const searchRoutes = Router();

searchRoutes.get("/", search);
searchRoutes.all("/", methodNotAllowed(["GET"]));
