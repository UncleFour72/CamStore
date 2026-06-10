import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { sequelize, User } from './models/index.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});
dotenv.config();

const app = express();
const port = Number(process.env.PORT || process.env.USER_SERVICE_PORT || 3001);

const bootstrapAdmin = async () => {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !password) {
    return;
  }

  const [admin, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      email,
      password,
      first_name: process.env.BOOTSTRAP_ADMIN_FIRST_NAME || 'CamStore',
      last_name: process.env.BOOTSTRAP_ADMIN_LAST_NAME || 'Admin',
      role: 'admin',
      is_active: true,
    },
  });

  if (!created && (admin.role !== 'admin' || !admin.is_active)) {
    await admin.update({ role: 'admin', is_active: true });
  }
};

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const ensureSocialAuthSchema = async () => {
  const [tables] = await sequelize.query("SHOW TABLES LIKE 'users'");

  if (tables.length === 0) {
    return;
  }

  await sequelize.query('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL');
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS user_identities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      provider ENUM('google', 'facebook') NOT NULL,
      provider_user_id VARCHAR(255) NOT NULL,
      provider_email VARCHAR(255) NULL,
      metadata JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_identities_provider_user (provider, provider_user_id),
      UNIQUE KEY uq_user_identities_user_provider (user_id, provider),
      INDEX idx_user_identities_provider_email (provider_email),
      CONSTRAINT fk_user_identities_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
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
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => {
  res.json({
    service: 'user-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);

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
  await ensureSocialAuthSchema();

  if (process.env.DB_SYNC !== 'false') {
    await sequelize.sync({ alter: process.env.DB_SYNC_ALTER === 'true' });
  }

  await bootstrapAdmin();

  app.listen(port, () => {
    console.log(`User Service running on port ${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start User Service:', error);
  process.exit(1);
});
