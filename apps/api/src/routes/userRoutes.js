import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const userRoutes = Router();

userRoutes.get("/", getUsers);
userRoutes.post("/", postUser);
userRoutes.all("/", methodNotAllowed(["GET", "POST"]));
