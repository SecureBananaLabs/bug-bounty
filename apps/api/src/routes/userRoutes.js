import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { getUsers, postUser } from "../controllers/userController.js";

export const userRoutes = Router();

userRoutes.get("/", authMiddleware, requireRole("admin"), getUsers);
userRoutes.post("/", postUser);
