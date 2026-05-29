import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import rateLimit from "express-rate-limit";

export const authRoutes = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                     // 10 attempts per window
  message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

authRoutes.post("/register", register);
authRoutes.post("/login", loginLimiter, login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", refresh);
