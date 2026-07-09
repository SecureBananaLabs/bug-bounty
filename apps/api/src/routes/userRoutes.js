import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const userRoutes = Router();

userRoutes.get("/", asyncHandler(getUsers));
userRoutes.post("/", asyncHandler(postUser));
