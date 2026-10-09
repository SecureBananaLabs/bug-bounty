import express, { type Request, type Response } from 'express';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

export function createApp() {
  const app = express();

  app.use(rateLimiter);
  app.use(express.json());

  // Route handlers
  app.use('/api', router);

  // Catch-all 404 handler — must come AFTER routes so defined routes are matched first
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Not found',
    });
  });

  // Error handler — must be last
  app.use(errorHandler);

  return app;
}
