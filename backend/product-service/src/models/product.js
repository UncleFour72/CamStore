import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Product extends Model {}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    slug: {
      type: DataTypes.STRING(280),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    short_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    sku: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    price: {
      type: DataTypes.DECIMAL(15, 0),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    original_price: {
      type: DataTypes.DECIMAL(15, 0),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    condition: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    badge: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    average_rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5,
      },
    },
    total_reviews: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    indexes: [
      { fields: ['slug'] },
      { fields: ['sku'] },
      { fields: ['brand'] },
      { fields: ['category_id'] },
      { fields: ['is_active'] },
    ],
  }
);

export default Product;
