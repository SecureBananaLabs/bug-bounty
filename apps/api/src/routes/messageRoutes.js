import { Router } from "express";
import { getMessages, postMessage } from "../controllers/messageController.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const messageRoutes = Router();

messageRoutes.get("/", getMessages);
messageRoutes.post("/", postMessage);
