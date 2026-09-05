import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const schema = z.object({ email: z.string().email(), role: z.enum(["admin", "client", "freelancer"]).default("client") }).strict();

export const userRoutes = Router();

userRoutes.get("/", getUsers);
userRoutes.post("/", validate(schema), postUser);
