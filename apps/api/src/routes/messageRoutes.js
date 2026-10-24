import { Router } from "express";
import { getMessages, postMessage, getMessage } from "../controllers/messageController.js";

export const messageRoutes = Router();

messageRoutes.get("/", getMessages);
messageRoutes.post("/", postMessage);
messageRoutes.get("/:id", getMessage);
