import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";

export const authRoutes = Router();

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

authRoutes.post("/register", wrap(register));
authRoutes.post("/login", wrap(login));
authRoutes.get("/oauth/:provider/callback", oauthCallback);
authRoutes.post("/refresh", wrap(refresh));
