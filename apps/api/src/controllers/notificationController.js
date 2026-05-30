import { ok, fail } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

// Notification creation schema — require essential fields
const notificationSchema = {
  userId: (v) => typeof v === "string" && v.length > 0,
  title: (v) => typeof v === "string" && v.length > 0 && v.length <= 200,
  body: (v) => typeof v === "string" && v.length > 0 && v.length <= 5000,
  type: (v) => ["info", "warning", "success", "error"].includes(v),
};

function validateNotification(payload) {
  if (!payload || typeof payload !== "object") return { valid: false, errors: ["Request body must be a non-null object"] };
  const errors = [];
  for (const [field, checker] of Object.entries(notificationSchema)) {
    if (!(field in payload)) { errors.push(`Missing required field: ${field}`); continue; }
    if (!checker(payload[field])) { errors.push(`Invalid value for field: ${field}`); }
  }
  // Reject unknown fields to prevent mass-assignment
  const allowed = new Set(Object.keys(notificationSchema));
  const unknown = Object.keys(payload).filter(k => !allowed.has(k));
  if (unknown.length > 0) errors.push(`Unknown fields not allowed: ${unknown.join(", ")}`);
  return { valid: errors.length === 0, errors };
}

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const { valid, errors } = validateNotification(req.body);
  if (!valid) return fail(res, errors.join("; "), 400);

  // Pass only validated/whitelisted fields to service
  const safe = {};
  for (const field of Object.keys(notificationSchema)) {
    safe[field] = req.body[field];
  }

  return ok(res, await createNotification(safe), 201);
}
