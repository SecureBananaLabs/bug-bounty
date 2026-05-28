import { Router } from "express";
import { getMessages, postMessage } from "../controllers/messageController.js";
import { authMiddleware } from "../middleware/auth.js";

export const messageRoutes = Router();

messageRoutes.get("authMiddleware, /", getMessages);
messageRoutes.post("authMiddleware, /", postMessage);
