import { Router } from "express";
import { computePi } from "../utils/pi.js";

export const piRoutes = Router();

piRoutes.get("/:decimals?", (req, res) => {
  try {
    const decimals = parseInt(req.params.decimals || "100", 10);
    const result = computePi(decimals);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
