import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getUsers, postUser } from "../controllers/userController.js";

export const userRoutes = Router();
userRoutes.use(authMiddleware);

userRoutes.get("/", getUsers);
userRoutes.post("/", postUser);

