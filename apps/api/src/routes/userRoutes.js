import { Router } from "express";
import { getProfileByUsername, getUsers, postUser } from "../controllers/userController.js";

export const userRoutes = Router();

userRoutes.get("/", getUsers);
userRoutes.get("/:username", getProfileByUsername);
userRoutes.post("/", postUser);
