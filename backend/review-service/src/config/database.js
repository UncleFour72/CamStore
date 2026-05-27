import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';

dotenv.config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
});
dotenv.config();

const sequelize = new Sequelize(
  process.env.REVIEW_DB_NAME || 'review_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'camstore_root_2026',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: process.env.SEQUELIZE_LOGGING === 'true' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: Number(process.env.DB_POOL_MIN || 0),
      acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
      idle: Number(process.env.DB_POOL_IDLE || 10000),
    },
    dialectOptions: {
      charset: 'utf8mb4',
    },
    timezone: '+07:00',
  }
);

export default sequelize;
