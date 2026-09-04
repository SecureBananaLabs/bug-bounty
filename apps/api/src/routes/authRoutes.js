import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { catchAsync } from "../utils/catchAsync.js";
import { authMiddleware } from "../middleware/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", catchAsync(register));
authRoutes.post("/login", catchAsync(login));
authRoutes.get("/oauth/:provider/callback", catchAsync(oauthCallback));
authRoutes.post("/refresh", authMiddleware, catchAsync(refresh));
