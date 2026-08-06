import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { catchAsync } from "../utils/catchAsync.js";
import { authMiddleware } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";

export const authRoutes = Router();

authRoutes.post("/register", authLimiter, catchAsync(register));
authRoutes.post("/login", authLimiter, catchAsync(login));
authRoutes.post("/refresh", authLimiter, authMiddleware, catchAsync(refresh));
authRoutes.post("/oauth/callback/:provider", catchAsync(oauthCallback));
