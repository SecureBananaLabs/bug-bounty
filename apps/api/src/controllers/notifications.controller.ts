import { Request, Response } from 'express';
import { createNotification } from '../services/notifications.service';
import { z } from 'zod';

const notificationSchema = z.object({
  type: z.string(),
  message: z.string(),
  recipientId: z.string(),
});

export const createNotificationController = async (req: Request, res: Response) => {
  try {
    const { body } = req;
    const result = notificationSchema.safeParse(body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid notification data' });
    }
    const notification = await createNotification(result.data);
    return res.status(201).json(notification);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create notification' });
  }
};