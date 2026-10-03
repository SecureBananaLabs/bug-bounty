import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRoutes = Router();

authRoutes.use(authLimiter);
authRoutes.post("/register", asyncHandler(register));
authRoutes.post("/login", asyncHandler(login));
authRoutes.get("/oauth/:provider/callback", asyncHandler(oauthCallback));
authRoutes.post("/refresh", asyncHandler(refresh));
