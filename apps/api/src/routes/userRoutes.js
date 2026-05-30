import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
import { createUserSchema } from "../validators/user.js";

export const userRoutes = Router();

userRoutes.get("/", getUsers);
userRoutes.post("/", async (req, res, next) => {
  try {
    req.body = createUserSchema.parse(req.body);
    return postUser(req, res);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});
