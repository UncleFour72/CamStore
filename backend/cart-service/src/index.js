import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { sequelize } from './models/index.js';
import cartRoutes from './routes/cartRoutes.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});
dotenv.config();

const app = express();
const port = Number(process.env.PORT || process.env.CART_SERVICE_PORT || 3003);

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
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => {
  res.json({
    service: 'cart-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', cartRoutes);

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

const ensureCartVariantColumns = async () => {
  const [tables] = await sequelize.query("SHOW TABLES LIKE 'cart_items'");

  if (tables.length === 0) {
    return;
  }

  const [columns] = await sequelize.query('SHOW COLUMNS FROM cart_items');
  const existingColumns = new Set(columns.map((column) => column.Field));

  const addColumn = async (name, definition) => {
    if (!existingColumns.has(name)) {
      await sequelize.query(`ALTER TABLE cart_items ADD COLUMN ${name} ${definition}`);
    }
  };

  await addColumn('variant_key', "VARCHAR(50) NOT NULL DEFAULT 'body' AFTER product_image");
  await addColumn('variant_name', 'VARCHAR(255) NULL AFTER variant_key');
  await addColumn('variant_price', 'DECIMAL(15,0) NULL AFTER variant_name');
  await addColumn('variant_image', 'VARCHAR(500) NULL AFTER variant_price');

  const [indexes] = await sequelize.query('SHOW INDEX FROM cart_items');
  const indexNames = new Set(indexes.map((index) => index.Key_name));

  const legacyUniqueIndexes = [
    'uq_cart_items_cart_product',
    'cart_items_cart_id_product_id',
  ];

  for (const indexName of legacyUniqueIndexes) {
    if (indexNames.has(indexName)) {
      await sequelize.query(`ALTER TABLE cart_items DROP INDEX ${indexName}`);
    }
  }

  if (!indexNames.has('uq_cart_items_cart_product_variant')) {
    await sequelize.query(
      'ALTER TABLE cart_items ADD UNIQUE KEY uq_cart_items_cart_product_variant (cart_id, product_id, variant_key)'
    );
  }
};

const start = async () => {
  await sequelize.authenticate();
  await ensureCartVariantColumns();

  if (process.env.DB_SYNC !== 'false') {
    await sequelize.sync({ alter: process.env.DB_SYNC_ALTER === 'true' });
  }

  app.listen(port, () => {
    console.log(`Cart Service running on port ${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start Cart Service:', error);
  process.exit(1);
});
