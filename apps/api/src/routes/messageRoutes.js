import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getMessages, postMessage } from "../controllers/messageController.js";

export const messageRoutes = Router();

messageRoutes.get("/", authMiddleware, getMessages);
messageRoutes.post("/", postMessage);
