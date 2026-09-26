import { Router } from "express";
import { getMessages, postMessage } from "../controllers/messageController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const messageRoutes = Router();

messageRoutes.get("/", asyncHandler(getMessages));
messageRoutes.post("/", asyncHandler(postMessage));
