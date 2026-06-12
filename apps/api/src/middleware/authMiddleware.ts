import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/UnauthorizedError';

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.header('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization token');
  }

  const token = authorization.split(' ')[1];

  // Validate token logic here
  // For demonstration purposes, assume token is valid
  next();
};

export { authMiddleware };