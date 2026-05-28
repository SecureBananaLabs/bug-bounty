import { Router } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { getUsers, postUser } from "../controllers/userController.js";

export const userRoutes = Router();

userRoutes.get("/", catchAsync(getUsers));
userRoutes.post("/", catchAsync(postUser));
