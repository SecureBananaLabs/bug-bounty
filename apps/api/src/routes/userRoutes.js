import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getUsers, postUser } from "../controllers/userController.js";

export const userRoutes = Router();

userRoutes.get("/", getUsers);
userRoutes.post("/", postUser);
