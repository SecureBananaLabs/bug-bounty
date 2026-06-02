import { Router } from "express";
import { search } from "../controllers/searchController.js";

export const searchRoutes = Router();

searchRoutes.get("/", (req, res, next) => {
  const { q } = req.query;

  if (Array.isArray(q)) {
    return res.status(400).json({ message: "Search query must be a single value" });
  }

  if (typeof q === "string" && q.trim() === "") {
    req.query.q = "";
    return next();
  }

  if (typeof q !== "string" || q.length > 200 || /[<>{}[\]\\]/.test(q)) {
    return res.status(400).json({ message: "Invalid search query" });
  }

  req.query.q = q.trim();
  next();
}, search);
