import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { BlogPost, sequelize } from './models/index.js';
import blogRoutes from './routes/blogRoutes.js';
import { run as seedBlogPosts } from './seed.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});
dotenv.config();

const app = express();
const port = Number(process.env.PORT || process.env.BLOG_SERVICE_PORT || 3007);

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
    service: 'blog-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', blogRoutes);

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

const seedBlogPostsWhenEmpty = async () => {
  if (process.env.SEED_BLOG_POSTS_ON_EMPTY === 'false') {
    return;
  }

  const postCount = await BlogPost.count();
  if (postCount > 0) {
    return;
  }

  console.log('Blog post table is empty. Seeding default CamStore blog posts...');
  await seedBlogPosts();
};

const start = async () => {
  await sequelize.authenticate();

  if (process.env.DB_SYNC !== 'false') {
    await sequelize.sync({ alter: process.env.DB_SYNC_ALTER === 'true' });
  }

  await seedBlogPostsWhenEmpty();

  app.listen(port, () => {
    console.log(`Blog Service running on port ${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start Blog Service:', error);
  process.exit(1);
});
