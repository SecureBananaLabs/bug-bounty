import { Router, Request, Response } from 'express';

export const users = Router();

users.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [],
  });
});
