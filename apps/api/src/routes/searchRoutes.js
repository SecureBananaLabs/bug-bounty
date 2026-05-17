import { Router } from "express";
import { search } from "../controllers/searchController.js";

export const searchRoutes = Router();

searchRoutes.get("/", search);
