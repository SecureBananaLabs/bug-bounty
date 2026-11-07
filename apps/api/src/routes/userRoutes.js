import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";

export const userRoutes = Router();

// Both endpoints require authentication:
// - GET / : listing all users (PII) must not be publicly accessible
// - POST / : user creation without auth allows unauthenticated account seeding
userRoutes.get("/", authMiddleware, getUsers);
userRoutes.post("/", authMiddleware, postUser);
