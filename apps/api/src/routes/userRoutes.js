import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
const authMiddleware = require('../middleware/auth');

export const userRoutes = Router();
// Require authentication on all user routes (matches adminRoutes)
router.use(authMiddleware);


userRoutes.get("/", getUsers);
userRoutes.post("/", postUser);
