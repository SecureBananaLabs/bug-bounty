import { Router } from "express";
import { getUser, getUsers, postUser } from "../controllers/userController.js";

export const userRoutes = Router();

userRoutes.get("/", getUsers);
userRoutes.get("/:id", getUser);
userRoutes.post("/", postUser);
