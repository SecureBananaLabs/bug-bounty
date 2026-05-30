import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getMessages, postMessage } from "../controllers/messageController.js";

export const messageRoutes = Router();

messageRoutes.get("/", requireAuth, getMessages);
messageRoutes.post("/", requireAuth, postMessage);