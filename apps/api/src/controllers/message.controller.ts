import { Request, Response } from 'express';
import { sendMessage } from '../services/message.service';

// ...

export const createMessage = async (req: Request, res: Response) => {
  try {
    const message = await sendMessage(req.body);
    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create message' });
  }
};