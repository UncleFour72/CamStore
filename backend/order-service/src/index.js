import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { startBankTransferPaymentJob } from './jobs/bankTransferJob.js';
import { Order, sequelize } from './models/index.js';
import orderRoutes from './routes/orderRoutes.js';
import { run as seedOrders } from './seed.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});
dotenv.config();

const app = express();
const port = Number(process.env.PORT || process.env.ORDER_SERVICE_PORT || 3004);

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
    service: 'order-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', orderRoutes);

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

const ensureOrderItemVariantColumns = async () => {
  const [tables] = await sequelize.query("SHOW TABLES LIKE 'order_items'");

  if (tables.length === 0) {
    return;
  }

  const [columns] = await sequelize.query('SHOW COLUMNS FROM order_items');
  const existingColumns = new Set(columns.map((column) => column.Field));

  const addColumn = async (name, definition) => {
    if (!existingColumns.has(name)) {
      await sequelize.query(`ALTER TABLE order_items ADD COLUMN ${name} ${definition}`);
    }
  };

  await addColumn('variant_id', 'INT NULL AFTER product_id');
  await addColumn('variant_key', 'VARCHAR(50) NULL AFTER variant_id');
  await addColumn('variant_name', 'VARCHAR(255) NULL AFTER variant_key');

  const [indexes] = await sequelize.query('SHOW INDEX FROM order_items');
  const indexNames = new Set(indexes.map((index) => index.Key_name));

  if (!indexNames.has('idx_order_items_variant_id')) {
    await sequelize.query('ALTER TABLE order_items ADD INDEX idx_order_items_variant_id (variant_id)');
  }
};

const seedOrdersWhenEmpty = async () => {
  if (process.env.SEED_ORDERS_ON_EMPTY === 'false') {
    return;
  }

  const orderCount = await Order.count();
  if (orderCount > 0) {
    return;
  }

  console.log('Order table is empty. Seeding default CamStore orders...');
  await seedOrders();
};

const start = async () => {
  await sequelize.authenticate();
  await ensureOrderItemVariantColumns();

  if (process.env.DB_SYNC !== 'false') {
    await sequelize.sync({ alter: process.env.DB_SYNC_ALTER === 'true' });
  }

  await seedOrdersWhenEmpty();

  app.listen(port, () => {
    console.log(`Order Service running on port ${port}`);
  });

  startBankTransferPaymentJob();
};

start().catch((error) => {
  console.error('Failed to start Order Service:', error);
  process.exit(1);
});
