import { Router } from "express";
import { login, logout, oauthCallback, refresh, register } from "../controllers/authController.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", refresh);
authRoutes.post("/logout", logout);
