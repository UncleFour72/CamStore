import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Wishlist extends Model {}

Wishlist.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Wishlist',
    tableName: 'wishlists',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['product_id'] },
      { fields: ['user_id', 'product_id'], unique: true },
    ],
  }
);

export default Wishlist;
