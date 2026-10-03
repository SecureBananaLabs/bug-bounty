import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const userRoutes = Router();

userRoutes.route("/")
  .get(getUsers)
  .post(postUser)
  .all(methodNotAllowed(["GET", "POST"]));
