import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getMessages, postMessage } from "../controllers/messageController.js";

messageRoutes.use(authMiddleware);

export const messageRoutes = Router();

messageRoutes.get("/", getMessages);
messageRoutes.post("/", postMessage);
