import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
// A refresh call carries the caller's existing token, so it must be authenticated
// before a new access token is minted for that same identity.
authRoutes.post("/refresh", authMiddleware, refresh);
