import { Router } from "express";
import { getUsers, postUser } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";
import { userSchema } from "../validators/user.js";

export const userRoutes = Router();

userRoutes.get("/", getUsers);
userRoutes.post("/", authMiddleware, async (req, res, next) => {
  try {
    const payload = userSchema.parse(req.body);
    req.validatedBody = payload;
    return postUser(req, res);
  } catch (err) {
    return next(err);
  }
});
