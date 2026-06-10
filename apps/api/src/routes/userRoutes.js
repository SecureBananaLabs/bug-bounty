import { Router } from "express";
import { getUsers, postUser, getUserProfile } from "../controllers/userController.js";

export const userRoutes = Router();

userRoutes.get("/", getUsers);
userRoutes.post("/", postUser);
userRoutes.get("/:username", getUserProfile);
