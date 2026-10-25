import { Router } from "express";
import { verifyToken } from "../utils/jwt";
export const authRouter = Router();
authRouter.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });
  try {
    const payload = verifyToken(refreshToken);
    return res.json({ token: "new-token", user: payload });
  } catch (e) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});
