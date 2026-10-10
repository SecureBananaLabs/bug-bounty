import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { createAuthLimiter } from "../middleware/rateLimit.js";

export const authRoutes = Router();
const authLimiter = createAuthLimiter();

authRoutes.post("/register", authLimiter, register);
authRoutes.post("/login", authLimiter, login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", authLimiter, refresh);
