import express from 'express';
import healthRouter from './routes/health.route.js';
import quoteRouter from './routes/quote.route.js';
import './listeners/stats.listener.js';

const app = express();

app.use(express.json());

app.use(healthRouter);
app.use(quoteRouter);

export default app;
