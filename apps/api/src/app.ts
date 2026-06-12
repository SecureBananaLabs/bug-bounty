import express from 'express';
import reviewsRouter from './routes/reviews';
import errorHandler from './middlewares/errorHandler';

const app = express();
app.use(express.json());

app.use('/api/reviews', reviewsRouter);

app.use(errorHandler);

export default app;