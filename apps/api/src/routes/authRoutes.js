import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });

export const authRoutes = Router();

authRoutes.post("/register", authLimiter, register);
authRoutes.post("/login", authLimiter, login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", refresh);
