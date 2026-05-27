import { Router } from "express";
import { search } from "../controllers/searchController.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const searchRoutes = Router();

searchRoutes.get("/", search);
