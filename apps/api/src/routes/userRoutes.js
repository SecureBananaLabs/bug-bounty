import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";

export const userRoutes = Router();

userRoutes.use(authMiddleware);

userRoutes.get("/", getUsers);
userRoutes.post("/", postUser);
