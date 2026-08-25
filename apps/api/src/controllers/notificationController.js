const { getNotifications, markAsRead, markAllAsRead } = require('../services/notificationService');
const { success, error } = require('../utils/response');

async function listNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { page, limit, unreadOnly } = req.query;
    const result = await getNotifications(userId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      unreadOnly: unreadOnly === 'true',
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const notification = await markAsRead(id, userId);
    if (!notification) return error(res, 'Notification not found', 404);
    return success(res, notification);
  } catch (err) {
    next(err);
  }
}

async function markAllNotificationsRead(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await markAllAsRead(userId);
    return success(res, { count: result.count });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, markNotificationRead, markAllNotificationsRead };