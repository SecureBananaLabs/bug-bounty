import { Router } from "express";
import { login, oauthCallback, refresh, register } from "../controllers/authController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const authRoutes = Router();

authRoutes.route("/register")
  .post(register)
  .all(methodNotAllowed(["POST"]));

authRoutes.route("/login")
  .post(login)
  .all(methodNotAllowed(["POST"]));

authRoutes.route("/oauth/:provider/callback")
  .get(oauthCallback)
  .all(methodNotAllowed(["GET"]));

authRoutes.route("/refresh")
  .post(refresh)
  .all(methodNotAllowed(["POST"]));
