import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendMessage } from '../services/message.service';

const createMessageSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content exceeds maximum length'),
  recipientId: z.string().min(1, 'Recipient ID is required'),
});

export const createMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, recipientId } = createMessageSchema.parse(req.body);
    const message = await sendMessage(content, recipientId);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};