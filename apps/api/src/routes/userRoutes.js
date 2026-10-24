import { Router } from "express";
import { getUsers, postUser, getUser } from "../controllers/userController.js";

export const userRoutes = Router();

userRoutes.get("/", getUsers);
userRoutes.post("/", postUser);
userRoutes.get("/:id", getUser);
