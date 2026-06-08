import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { Category, Product, ProductImage, ProductVariant, sequelize } from './models/index.js';
import productRoutes from './routes/productRoutes.js';
import { makeSlug } from './controllers/productController.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});
dotenv.config();

const app = express();
const port = Number(process.env.PORT || process.env.PRODUCT_SERVICE_PORT || 3002);

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const bootstrapCategories = async () => {
  const categories = [
    {
      name: 'May anh',
      slug: 'camera',
      description: 'Mirrorless, DSLR va compact cao cap',
    },
    {
      name: 'Ong kinh',
      slug: 'lens',
      description: 'Prime, zoom va lens chuyen dung',
    },
    {
      name: 'Phu kien',
      slug: 'accessory',
      description: 'Tripod, flash, filter, tui may va the nho',
    },
    {
      name: 'Flycam',
      slug: 'drone',
      description: 'Flycam va thiet bi quay tren khong',
    },
  ];

  for (const category of categories) {
    await Category.findOrCreate({
      where: { slug: category.slug || makeSlug(category.name) },
      defaults: category,
    });
  }
};

const bootstrapDefaultVariants = async () => {
  const products = await Product.findAll({
    include: [
      {
        model: ProductVariant,
        as: 'variants',
        attributes: ['id'],
      },
      {
        model: ProductImage,
        as: 'images',
        separate: true,
        order: [
          ['is_primary', 'DESC'],
          ['sort_order', 'ASC'],
          ['id', 'ASC'],
        ],
      },
    ],
  });

  for (const product of products) {
    if (product.variants?.length) {
      continue;
    }

    const primaryImage = product.images?.[0]?.image_url || null;
    await ProductVariant.create({
      product_id: product.id,
      variant_key: 'body',
      name: product.name,
      sku: product.sku ? `${product.sku}-BODY`.slice(0, 120) : null,
      price: product.price,
      original_price: product.original_price,
      stock_quantity: product.stock_quantity,
      image_url: primaryImage,
      sort_order: 0,
      is_default: true,
      is_active: true,
    });
  }
};

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
    service: 'product-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', productRoutes);

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

const start = async () => {
  await sequelize.authenticate();

  if (process.env.DB_SYNC !== 'false') {
    await sequelize.sync({ alter: process.env.DB_SYNC_ALTER === 'true' });
  }

  await bootstrapCategories();
  await bootstrapDefaultVariants();

  app.listen(port, () => {
    console.log(`Product Service running on port ${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start Product Service:', error);
  process.exit(1);
});
