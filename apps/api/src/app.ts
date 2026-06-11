import express, { Application } from 'express';
import adminRouter from './routes/admin';

const app: Application = express();

app.use('/api/admin', adminRouter);

export default app;