import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(register));
authRoutes.post("/login", asyncHandler(login));
authRoutes.get("/oauth/:provider/callback", asyncHandler(oauthCallback));
authRoutes.post("/refresh", asyncHandler(refresh));
