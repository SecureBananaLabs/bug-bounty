import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const paymentRoutes = Router();

paymentRoutes.route("/")
  .post(createPayment)
  .all(methodNotAllowed(["POST"]));
