import { NextFunction, Request, Response } from 'express';

const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Malformed JSON request body' });
  }

  // existing error handling logic
  // ...
};

export default errorHandler;