import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimit.js";

export const authRoutes = Router();

authRoutes.use(["/register", "/login", "/refresh"], authLimiter);

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", refresh);
