import { Router } from "express";
import { getSettings } from "../controllers/settingsController.js";

export const settingsRoutes = Router();

settingsRoutes.get("/", getSettings);
