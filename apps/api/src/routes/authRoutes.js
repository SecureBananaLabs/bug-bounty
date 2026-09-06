import { Router } from "express";
import { register, login } from "../controllers/authController.js";

const router = Router();

// Prevent admin role self-assignment during registration
router.post("/register", (req, res, next) => {
  if (req.body.role === "admin") {
    return res.status(400).json({ error: "Admin role cannot be self-assigned" });
  }
  next();
}, register);

router.post("/login", login);

export { router as authRoutes };
