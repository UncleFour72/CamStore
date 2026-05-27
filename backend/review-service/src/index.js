import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { sequelize } from './models/index.js';
import reviewRoutes from './routes/reviewRoutes.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});
dotenv.config();

const app = express();
const port = Number(process.env.PORT || process.env.REVIEW_SERVICE_PORT || 3006);

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => {
  res.json({
    service: 'review-service',
    status: 'ok (skeleton)',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', reviewRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  console.error(error);
  return res.status(error.statusCode || 500).json({
    message: error.message || 'Internal server error',
  });
});

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    if (process.env.DB_SYNC !== 'false') {
      await sequelize.sync({ alter: process.env.DB_SYNC_ALTER === 'true' });
      console.log('Database synced');
    }

    app.listen(port, () => {
      console.log(`Review Service (skeleton) running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start Review Service:', error);
    process.exit(1);
  }
};

start();
