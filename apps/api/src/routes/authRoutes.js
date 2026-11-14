import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { loginLimiter } from "../middleware/rateLimit.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", loginLimiter, login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", refresh);
