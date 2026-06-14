import express, { Express } from 'express';
import { preBodyParserRateLimiter } from './middleware/rateLimiter';

const app: Express = express();

// Apply rate limiter BEFORE body parsing middleware
// This ensures malformed JSON requests are still counted
app.use(preBodyParserRateLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Other middleware
// app.use(cors());
// app.use(helmet());

// Routes would go here
// app.use('/api/auth', authRoutes);
// app.use('/api/jobs', jobRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Handle JSON parsing errors specifically
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Malformed JSON in request body'
    });
  }
  
  // Handle other errors
  console.error(err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

export default app;