import { Router } from "express";
import { getUsers, postUser, getUserProfile } from "../controllers/userController.js";

export const userRoutes = Router();

userRoutes.get("/", getUsers);
userRoutes.get("/:username", getUserProfile);
userRoutes.post("/", postUser);
