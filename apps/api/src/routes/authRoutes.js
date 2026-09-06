import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
// Refresh requires a valid current token to issue a new one.
authRoutes.post("/refresh", authMiddleware, refresh);

