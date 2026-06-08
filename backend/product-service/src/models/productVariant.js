import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProductVariant extends Model {}

ProductVariant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    variant_key: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    sku: {
      type: DataTypes.STRING(120),
      allowNull: true,
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
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'ProductVariant',
    tableName: 'product_variants',
    indexes: [
      { fields: ['product_id'] },
      { fields: ['sku'] },
      { fields: ['is_active'] },
      {
        name: 'uq_product_variants_product_key',
        fields: ['product_id', 'variant_key'],
        unique: true,
      },
    ],
  }
);

export default ProductVariant;
