import { ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { parsePagination, paginate } from "../utils/pagination.js";

export async function getNotifications(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await listNotifications({ skip, limit });
  return ok(res, paginate(items, total, page, limit));
}

export async function postNotification(req, res) {
  return ok(res, await createNotification(req.body), 201);
}
