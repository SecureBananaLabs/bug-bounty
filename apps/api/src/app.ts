import express from 'express';
import cors from 'cors';
import { rateLimiter } from './middleware/rateLimiter';

const app = express();

// Apply rate limiter BEFORE body parsing middleware
// This ensures malformed JSON requests are still counted
app.use(rateLimiter);

// Body parsing middleware - comes AFTER rate limiting
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors());

// Routes would be imported and used here
// Import routes after middleware setup

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;