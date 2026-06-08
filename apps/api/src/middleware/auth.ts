import { NextFunction, Request, Response } from 'express';

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    return res.status(401).send('Unauthorized');
  }
  // Add your authentication logic here
  next();
};

export default authenticate;