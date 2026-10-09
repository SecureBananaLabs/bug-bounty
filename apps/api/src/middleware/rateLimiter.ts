import type { Request, Response, NextFunction } from 'express';

export function rateLimiter(_req: Request, res: Response, next: NextFunction) {
  next();
}
