import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

export { authMiddleware };