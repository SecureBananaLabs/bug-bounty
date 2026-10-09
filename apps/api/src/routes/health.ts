import { Router, Request, Response } from 'express';

export const healthCheck = Router();

healthCheck.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'OK',
  });
});
