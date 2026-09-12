import rateLimit from "express-rate-limit";
import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

export const authRoutes = Router();

authRoutes.use(authLimiter);
authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", refresh);
