import { Router } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { getMessages, postMessage } from "../controllers/messageController.js";

export const messageRoutes = Router();

messageRoutes.get("/", catchAsync(getMessages));
messageRoutes.post("/", catchAsync(postMessage));
