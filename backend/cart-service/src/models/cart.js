import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Cart extends Model {}

Cart.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      validate: {
        min: 1,
      },
    },
  },
  {
    sequelize,
    modelName: 'Cart',
    tableName: 'carts',
    indexes: [{ fields: ['user_id'], unique: true }],
  }
);

export default Cart;
