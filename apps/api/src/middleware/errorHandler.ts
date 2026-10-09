import { type Errback, type Request, type Response } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: Errback) {
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}
