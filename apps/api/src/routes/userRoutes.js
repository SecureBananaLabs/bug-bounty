import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";

export const userRoutes = Router();

// All user-management routes require authentication at minimum.
userRoutes.use(authMiddleware);
userRoutes.get("/", getUsers);
userRoutes.post("/", postUser);

