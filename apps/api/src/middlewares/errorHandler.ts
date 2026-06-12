import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof Error) {
    console.error(err);
    res.status(500).send({ message: 'Internal Server Error' });
  } else {
    next(err);
  }
}