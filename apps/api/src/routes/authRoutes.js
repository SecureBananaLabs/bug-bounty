import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", validate(registerSchema), register);
authRoutes.post("/login", validate(loginSchema), login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", refresh);
