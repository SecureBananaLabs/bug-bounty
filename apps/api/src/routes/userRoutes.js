import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminCheck } from "../middleware/adminCheck.js";
import { getUsers, postUser } from "../controllers/userController.js";

export const userRoutes = Router();

userRoutes.get("/", authMiddleware, adminCheck, getUsers);
userRoutes.post("/", authMiddleware, adminCheck, postUser);