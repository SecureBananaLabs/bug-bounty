import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimit.js";

export const authRoutes = Router();

authRoutes.post("/register", authLimiter, register);
authRoutes.post("/login", authLimiter, login);
authRoutes.post("/refresh", authLimiter, refresh);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
