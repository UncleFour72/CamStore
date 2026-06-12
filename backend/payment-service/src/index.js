import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { Payment, sequelize } from './models/index.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { run as seedPayments } from './seed.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});
dotenv.config();

const app = express();
const port = Number(process.env.PORT || process.env.PAYMENT_SERVICE_PORT || 3005);

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
    service: 'payment-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode =
    error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError'
      ? 400
      : error.statusCode || 500;

  const details =
    error.errors?.map((item) => ({
      field: item.path,
      message: item.message,
    })) || undefined;

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    message: statusCode >= 500 ? 'Internal server error' : error.message,
    details,
  });
});

const seedPaymentsWhenEmpty = async () => {
  if (process.env.SEED_PAYMENTS_ON_EMPTY === 'false') {
    return;
  }

  const paymentCount = await Payment.count();
  if (paymentCount > 0) {
    return;
  }

  console.log('Payment table is empty. Seeding default CamStore payments...');
  await seedPayments();
};

const start = async () => {
  await sequelize.authenticate();

  if (process.env.DB_SYNC !== 'false') {
    await sequelize.sync({ alter: process.env.DB_SYNC_ALTER === 'true' });
  }

  await seedPaymentsWhenEmpty();

  app.listen(port, () => {
    console.log(`Payment Service running on port ${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start Payment Service:', error);
  process.exit(1);
});
