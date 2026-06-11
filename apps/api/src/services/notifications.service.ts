import { prisma } from '../../prismaClient';

export const createNotification = async (data: {
  type: string;
  message: string;
  recipientId: string;
}) => {
  const notification = await prisma.notification.create({
    data: {
      type: data.type,
      message: data.message,
      recipientId: data.recipientId,
    },
  });
  return notification;
};