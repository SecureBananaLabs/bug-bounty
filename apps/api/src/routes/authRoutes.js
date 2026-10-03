import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRoutes = Router();

// Credential endpoints get the strict limiter; the general API budget of
// 200 req / 15 min is far too permissive for password guessing. The OAuth
// callback is left on the general budget because it carries no password.
authRoutes.post("/register", authLimiter, asyncHandler(register));
authRoutes.post("/login", authLimiter, asyncHandler(login));
authRoutes.get("/oauth/:provider/callback", asyncHandler(oauthCallback));
authRoutes.post("/refresh", authLimiter, asyncHandler(refresh));
