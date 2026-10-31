import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", authMiddleware, refresh);
