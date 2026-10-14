import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-7" });\n\nexport const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", refresh);
