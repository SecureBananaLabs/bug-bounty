import { Router } from "express";
import { refreshToken } from "../services/authService.js";

const router = Router();

router.post("/refresh", (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  try {
    const tokens = refreshToken(token); // returns { accessToken, refreshToken? }
    res.json(tokens);
  } catch (error) {
    if (error.message === "invalid token") {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as authRoutes };
