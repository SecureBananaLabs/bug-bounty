import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createUserSchema } from "../validators/user.js";

export const userRoutes = Router();

userRoutes.get("/", authMiddleware, getUsers);
userRoutes.post("/", authMiddleware, validate(createUserSchema), postUser);
