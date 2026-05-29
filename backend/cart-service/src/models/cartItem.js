import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CartItem extends Model {}

CartItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cart_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    product_price: {
      type: DataTypes.DECIMAL(15, 0),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    product_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
  },
  {
    sequelize,
    modelName: 'CartItem',
    tableName: 'cart_items',
    indexes: [
      { fields: ['cart_id'] },
      { fields: ['product_id'] },
      { fields: ['cart_id', 'product_id'], unique: true },
    ],
  }
);

export default CartItem;
