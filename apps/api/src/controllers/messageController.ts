import { Request, Response } from 'express';

const getMessages = async (req: Request, res: Response) => {
  // Get messages logic here
  res.json([]);
};

const createMessage = async (req: Request, res: Response) => {
  // Create message logic here
  res.json({});
};

export { getMessages, createMessage };