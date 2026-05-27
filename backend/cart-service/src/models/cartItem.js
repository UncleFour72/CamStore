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
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    product_price: {
      type: DataTypes.DECIMAL(15, 0),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'CartItem',
    tableName: 'cart_items',
  }
);

export default CartItem;
