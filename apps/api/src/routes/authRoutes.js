import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", refresh);
