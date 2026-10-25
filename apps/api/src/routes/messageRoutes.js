import { Router } from "express";
import { getMessage, getMessages, postMessage } from "../controllers/messageController.js";

export const messageRoutes = Router();

messageRoutes.get("/", getMessages);
messageRoutes.get("/:id", getMessage);
messageRoutes.post("/", postMessage);
