import express, { Request, Response, NextFunction } from 'express';
import errorHandler from '../middleware/errorHandler';

const app = express();

// existing route setup
// ...

app.use(errorHandler);

export default app;