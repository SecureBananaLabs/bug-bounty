import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async.js";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(register));
authRoutes.post("/login", asyncHandler(login));
authRoutes.get("/oauth/:provider/callback", asyncHandler(oauthCallback));
authRoutes.post("/refresh", authMiddleware, asyncHandler(refresh));
