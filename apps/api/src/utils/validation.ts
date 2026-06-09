import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export function validate(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).send({ message: 'Validation error', errors: error.issues });
      } else {
        next(error);
      }
    }
  };
}