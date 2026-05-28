import { Router } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { search } from "../controllers/searchController.js";

export const searchRoutes = Router();

searchRoutes.get("/", catchAsync(search));
