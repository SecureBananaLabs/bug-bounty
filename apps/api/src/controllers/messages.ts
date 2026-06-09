import { Request, Response } from 'express';
import { Message } from '../../../packages/db/prisma/models';

const createMessage = async (req: Request, res: Response) => {
  try {
    const message = await Message.create({
      data: {
        text: req.body.text,
        userId: req.user.id,
      },
    });
    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create message' });
  }
};

export const messageController = {
  createMessage,
};