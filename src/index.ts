import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import winston from 'winston';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/bounties', (req, res) => {
  const { title, description, reward } = req.body;
  
  if (!title || !description || !reward) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const bounty = {
    id: uuidv4(),
    title,
    description,
    reward,
    createdAt: new Date().toISOString(),
  };
  
  logger.info('Bounty created', { bountyId: bounty.id });
  res.status(201).json(bounty);
});

app.get('/api/bounties/:id', (req, res) => {
  const { id } = req.params;
  res.json({ id, title: 'Sample Bounty', description: 'Sample description', reward: 100 });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
<<<ENDFILE>>

Let me check the test files to understand the test structure.
