import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getMessages, postMessage } from "../controllers/messageController.js";

const msgLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40 });

export const messageRoutes = Router();

messageRoutes.get("/", getMessages);
messageRoutes.post("/", msgLimiter, postMessage);
