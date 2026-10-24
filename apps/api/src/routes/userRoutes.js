import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";

export const userRoutes = Router();

// The directory holds the account records every other route keys off, so both
// handlers need the verified bearer identity instead of answering anonymous callers.
userRoutes.use(authMiddleware);
userRoutes.get("/", getUsers);
userRoutes.post("/", postUser);
