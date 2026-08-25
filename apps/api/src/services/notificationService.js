const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const where = { userId };
  if (unreadOnly) where.read = false;

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return { items, total, page, limit };
}

async function markAsRead(notificationId, userId) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) return null;
  if (notification.userId !== userId) return null;
  if (notification.read) return notification;

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

async function markAllAsRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

module.exports = { getNotifications, markAsRead, markAllAsRead };