import { Router } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";

export const authRoutes = Router();

authRoutes.post("/register", catchAsync(register));
authRoutes.post("/login", catchAsync(login));
authRoutes.get("/oauth/:provider/callback", catchAsync(oauthCallback));
authRoutes.post("/refresh", catchAsync(refresh));
