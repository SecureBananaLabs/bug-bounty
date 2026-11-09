import { forbidden } from "../utils/response.js";

export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return forbidden(res, "Admin access required");
  }
  next();
};
