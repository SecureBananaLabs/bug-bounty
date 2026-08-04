import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";

export const userRoutes = Router();

userRoutes.get("/", authMiddleware, getUsers);
userRoutes.post("/", authMiddleware, postUser);
