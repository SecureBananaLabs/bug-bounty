import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      issues: error.issues,
    });
  }

  console.error(error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

export default errorHandler;