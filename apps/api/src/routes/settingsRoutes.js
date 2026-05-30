import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  handleChangePassword,
  handleUpdateProfile,
  handleDeleteAccount,
} from "../controllers/settingsController.js";

export const settingsRoutes = Router();

// All settings routes require authentication
settingsRoutes.use(authMiddleware);

settingsRoutes.put("/password", handleChangePassword);
settingsRoutes.put("/profile", handleUpdateProfile);
settingsRoutes.delete("/account", handleDeleteAccount);
