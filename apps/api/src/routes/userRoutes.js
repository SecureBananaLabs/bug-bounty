import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
const authMiddleware = require('../middleware/auth');

export const userRoutes = Router();
router.use(authMiddleware);

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
userRoutes.post("/", postUser);
