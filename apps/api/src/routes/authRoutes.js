import { Router } from "express";
import { register, login, oauthCallback, refresh } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimit.js";

export const authRoutes = Router();

authRoutes.post("/register", authLimiter, register);
authRoutes.post("/login", authLimiter, login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", refresh);
