import { Router } from "express";
import { search } from "../controllers/searchController.js";

export const searchRoutes = Router();

searchRoutes.get("/", (req, res, next) => {
  let query = req.query.q;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }
  query = query.trim();
  if (query.length === 0) {
    return res.status(400).json({ error: "Query cannot be empty" });
  }
  if (query.length > 200) {
    return res.status(400).json({ error: "Query exceeds maximum length of 200 characters" });
  }
  req.query.q = query;
  next();
}, search);
