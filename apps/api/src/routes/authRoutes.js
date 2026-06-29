import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { wrapAsync } from "../utils/wrapAsync.js";

export const authRoutes = Router();

authRoutes.post("/register", wrapAsync(register));
authRoutes.post("/login", wrapAsync(login));
authRoutes.get("/oauth/:provider/callback", wrapAsync(oauthCallback));
authRoutes.post("/refresh", wrapAsync(refresh));
