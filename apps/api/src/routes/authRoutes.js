import rateLimit from "express-rate-limit";
import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";

export const authRoutes = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

authRoutes.post("/register", authLimiter, register);
authRoutes.post("/login", authLimiter, login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", authLimiter, refresh);
